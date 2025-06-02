// Importa a biblioteca pg, responsável por gerenciar a conexão com o PostgreSQL.
import pg from 'pg';

// Nesse exemplo uso o dotenv para carregar as variáveis de ambiente do arquivo .env
import dotenv from 'dotenv';
dotenv.config(); // Garante que as variáveis de ambiente sejam carregadas
// Mas pode ser adaptado para qualquer outra forma de configuração que você esteja usando.

// Importa a classe Pool do módulo pg, que é usada para gerenciar um pool de conexões com o PostgreSQL.
const { Pool } = pg;

// Cria e configura o pool de conexões PGSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || '',
  password: process.env.DB_PASS || '',
  port: process.env.DB_PORT || 5432,
  min: 5,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Gerenciador de eventos do pool de conexões

// O evento 'connect' é acionado quando um novo cliente é conectado ao pool.
pool.on('connect', (client) => {
  // Mostra mensagem no console que nova conexão foi aberta.
  console.log(`[DB Pool] Nova conexão estabelecida com o PostgreSQL.`);
});

// O evento 'acquire' é acionado quando um cliente é adquirido do pool.
pool.on('acquire', (client) => {
  // Mostra mensagem no console que uma conexão foi adquirida do pool.
  console.log(`[DB Pool] Conexão adquirida do pool.`);
});

// O evento 'remove' é acionado quando um cliente é removido do pool.
pool.on('release', (err, client) => {
  // Mostra mensagem no console que uma conexão foi liberada de volta ao pool
  if (err) {
    // Mostra mensagem de erro se houver
    console.error('[DEBUG][DB Pool] Erro ao liberar cliente de volta ao pool:', err.stack);
  } else {
    // Se não houver erro, mostra mensagem de sucesso
    console.log(`[DEBUG][DB Pool] Conexão liberada de volta para o pool.`);
  }

});

// O evento 'error' é acionado quando um erro ocorre em um cliente ocioso do pool.
pool.on('error', (err, client) => {
  // Mostra mensagem de erro no console se ocorrer um erro em um cliente ocioso do pool.
  console.error('[DEBUG][DB Pool] Erro em um cliente ocioso do pool:', err.stack);
});

// O evento 'remove' é acionado quando um cliente é removido do pool, seja por erro ou por ser fechado.
pool.on('remove', (client) => {
  // Mostra mensagem no console que uma conexão foi removida do pool.
  console.log(`[DEBUG][DB Pool] Conexão removida do pool.`);
  // Você pode adicionar mais detalhes aqui se o objeto 'client' tiver alguma identificação
  // que você atribuiu anteriormente, por exemplo: console.log(`[DB Pool] Conexão ID ${client.id} removida.`);
});

// Função de query básica, para executar diretamente comandos SQL
/**
 * Executa uma query SQL simples usando o pool de conexões.
 * @param {string} text - A string SQL a ser executada.
 * @param {Array} [params] - Os parâmetros para a query, se necessário.
 * @returns {Promise} - Retorna uma Promise que resolve com o resultado da query.
 */
async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}


// Obtém um cliente dedicado do pool
/**
 * Obtém um cliente do pool de conexões.
 * @returns {Promise<pg.Client>} - Retorna uma Promise que resolve com um cliente conectado.
 */
async function getClient() {
  if (process.env.DEBUG === 'true') {
    const status = getPoolStatus();
    console.log(`[DEBUG] Obtendo conexão, total de conexões ativas: ${status.totalCount}, ociosas: ${status.idleCount}, na fila: ${status.waitingCount}`);
  }
  const client = await pool.connect();
  return client;
}

// Executa uma query usando um cliente existente (importante para transações)
/**
 * Executa uma query SQL usando um cliente específico obtido anteriormente.
 * @param {pg.Client} client - O cliente conectado do pool.
 * @param {string} text - A string SQL a ser executada.
 * @param {Array} [params] - Os parâmetros para a query, se necessário.
 * @returns {Promise} - Retorna uma Promise que resolve com o resultado da query.
 */
async function queryWithClient(client, text, params) {
  // Não colocamos try/catch aqui para que o erro "suba" para o controle da transação
  const res = await client.query(text, params);
  return res;
}

// Inicia a transação
/**
 * Inicia uma transação no cliente fornecido.
 * @param {pg.Client} client - O cliente conectado do pool.
 * @returns {Promise<void>} - Retorna uma Promise que resolve quando a transação for iniciada.
 */
async function beginTransaction(client) {
  await client.query('BEGIN');

  if (process.env.DEBUG === 'true') {
    console.log("[DEBUG] Iniciado transação (BEGIN)");
  }
}

// Confirma a transação
/**
 * Confirma a transação no cliente fornecido.
 * @param {pg.Client} client - O cliente conectado do pool.
 * @returns {Promise<void>} - Retorna uma Promise que resolve quando a transação for confirmada.
 */
async function commitTransaction(client) {
  await client.query('COMMIT');
  if (process.env.DEBUG === 'true') {
    console.log("[DEBUG] Finalizado transação (COMMIT)");
  }
}

// Desfaz a transação
/**
 * Desfaz a transação no cliente fornecido.
 * @param {pg.Client} client - O cliente conectado do pool.
 * @returns {Promise<void>} - Retorna uma Promise que resolves quando a transação for desfeita.
 */
async function rollbackTransaction(client) {
  await client.query('ROLLBACK');
  if (process.env.DEBUG === 'true') {
    console.log("[DEBUG] Cancelado transação (ROLLBACK)");
  }
}

// Libera o cliente de volta ao pool (deve ser chamado no finally)
/**
 *  libera o cliente de volta ao pool de conexões.
 * @param {pg.Client} client - O cliente conectado do pool.
 * @returns {void} - Não retorna nada, apenas libera o cliente.
 */
function releaseClient(client) {
  if (client) {
    client.release();
    if (process.env.DEBUG === 'true') {
      console.log("[DEBUG] Liberado conexão");
    }
  }
}

/**
 * Retorna estatísticas sobre o estado atual do pool de conexões.
 * @returns {object} Um objeto com as seguintes propriedades:
 *  - totalCount: Número total de clientes (conexões) no pool (ociosos + em uso).
 *  - idleCount: Número de clientes ociosos no pool.
 *  - waitingCount: Número de solicitações de clientes na fila aguardando uma conexão.
 */
function getPoolStatus() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    // As configurações do pool também podem ser úteis para depuração
    // maxConnections: pool.options.max, // Nota: pool.options não é uma propriedade padrão documentada para acessar 'max' diretamente após a inicialização.
    // 'max' é acessível via pool.options.max se você estiver usando uma versão mais antiga ou uma forma específica de configuração.
    // A forma mais garantida de saber o 'max' configurado é lembrar o valor que você passou na inicialização.
  };
}

// Exporta as funções e o pool para uso em outros módulos
export {
  query,
  getClient,
  queryWithClient,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  releaseClient,
  getPoolStatus
};