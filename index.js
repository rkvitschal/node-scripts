// Para utilizar o Redis, primeiro precisamos importar ele do nosos arquivo, no momento que ele for importado
// a primeira vez, ele fará a conexão com o Redis, e depois disso, podemos usar ele em qualquer lugar do nosso código.
import { redisClient } from './src/database/redis.js';


// Exemplo de solicitação ao Redis
await redisClient.set('chave', 'valor');
const valor = await redisClient.get('chave');
console.log('Valor da chave:', valor);
// Fim do exemplo simples de solicitação ao Redis

// Para utilizar o PostgreSQL, primeiro precisamos importar ele do nosso arquivo, no momento que ele for importado
// a primeira vez, ele fará a conexão com o PostgreSQL, e depois disso, podemos usar ele em qualquer lugar do nosso código.
import {
    query,
    getClient,
    queryWithClient,
    beginTransaction,
    commitTransaction,
    rollbackTransaction,
    releaseClient,
    getPoolStatus
} from './src/database/pg.js';

// Exemplo de solicitação simples ao PostgreSQL
const resultSimples = await query('SELECT NOW()');
console.log('Resultado simples:', resultSimples.rows);
// Tratar o resultado como necessário
// Fim do exemplo de solicitação simples ao PostgreSQL

// --------------

// Exemplo de solicitação com Cliente
let pgClient;
try {
    pgClient = await getClient();
    await beginTransaction(pgClient);

    const resultComCliente = await queryWithClient(pgClient, 'SELECT NOW()');
    console.log('Resultado com Cliente:', resultComCliente.rows);

    await commitTransaction(pgClient);
} catch (error) {
    if (pgClient) {
        await rollbackTransaction(pgClient);
        console.error('Erro durante a transação, rollback realizado:', error);
    } else {
        console.error('Erro ao obter cliente PostgreSQL:', error);
    }
} finally {
    if (pgClient) {
        releaseClient(pgClient);
        console.log('Cliente PostgreSQL liberado de volta ao pool.');
    }
}
// Fim do exemplo de solicitação com Cliente ao PostgreSQL