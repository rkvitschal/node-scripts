# Conjunto de pequenos scripts em Node.JS
Esse repositório contém alguns exemplos de pequenos scripts em Node.JS que auxiliam com funções predefinidas para tarefas do dia a dia, como conexões com banco de dados, gestão de dados e todas as informações iniciais para vários processos.

Criei esse repositório com a ideia de deixar salvo essas funções para facilitar o desenvolvimento de futuros App que usem qualquer dependência aqui exemplificada.

# Dependência básica
Em todos os exemplos utilizo o dotenv para carregar variáveis ambiente do arquivo .env, mas pode ser adaptado para sua necessidade, não sendo obrigatório o uso do dotenv

# Indice de funções
* [PostgreSQL](#postgresql)
* [Redis](#redis)



# PostgreSQL
## Conexão com Banco de Dados PostgreSQL
Nesse script utilizo a biblioteca 'pg' do node, para instalar executar o comando abaixo, ou com seu gerenciador de pacotes preferidos
```bash
npm install pg
```

E então importar as declarações básicas
```js
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
```

Temos duas opções, uma query simples, que não precisamos buscar todos os dados do cliente, útil em um select simples
```js
const resultSimples = await query('SELECT NOW()');
console.log('Resultado simples:', resultSimples.rows);
```

E temos o processo mais complexo, que podemos iniciar uma transação, e executar múltiplos comandos SQL em sequência, e então finalizar a transação ou abortar
```js
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
```

# Redis
## Conexão com Banco de Dados Redis
Nesse script utilizo a biblioteca 'ioredis' do node, para instalar executar o comando abaixo, ou com seu gerenciador de pacotes preferidos.
```bash
npm install ioredis
```

E então importar as declarações básicas
```js
import { redisClient } from './src/database/redis.js';
```

Depois de importar o cliente do Redis, será iniciado a conexão na primeira vez que for chamado o arquivo, depois disso podemos usar os comandos do Redis, como por exemplo
```js
await redisClient.set('chave', 'valor');
const valor = await redisClient.get('chave');
```

Podemos também usar comandos como PUB/SUB, e entre outros comandos do Redis, que não vou exemplificar todos nesse arquivo.