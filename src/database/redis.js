// Importa a biblioteca ioredis responsável por gerenciar a conexão com o Redis.
import Redis from 'ioredis';

// Nesse exemplo uso o dotenv para carregar as variáveis de ambiente do arquivo .env
import dotenv from 'dotenv';
dotenv.config(); // Garante que as variáveis de ambiente sejam carregadas
// Mas pode ser adaptado para qualquer outra forma de configuração que você esteja usando.


// Cria a configuração do cliente Redis
const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    // Adicione o username apenas se ele estiver definido
    ...(process.env.REDIS_USERNAME && { username: process.env.REDIS_USERNAME }),
    // Adicione a senha apenas se ela estiver definida
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
    // Adicione o db apenas se ele estiver definido
    ...(process.env.REDIS_DB && { db: parseInt(process.env.REDIS_DB, 10) }),
    // Configurações de reconexão (ioredis já tem bons padrões, mas você pode ajustar)
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000); // Tenta reconectar a cada 50ms, até um máximo de 2s
        return delay;
    },
    maxRetriesPerRequest: 3 // Número de tentativas para um comando antes de falhar
};

// Cria uma instância do cliente Redis com a configuração anterior.
const redisClient = new Redis(redisConfig);


// Gerenciador de eventos do Redis (Opcional)
// Esses eventos ajudam a monitorar o estado da conexão e podem ser úteis para depuração.

// Evento de conexão bem-sucedida
redisClient.on('connect', () => {
    console.log('🔌 Conectado ao Redis com sucesso!');
});

// Evento de Redis pronto para uso.
redisClient.on('ready', () => {
    console.log('✅ Cliente Redis pronto para uso.');
});

// Evento de erro na conexão
redisClient.on('error', (err) => {
    console.error('❌ Erro na conexão com o Redis:', err);
    // ioredis tentará reconectar automaticamente com base na retryStrategy.
    // Se a conexão for perdida permanentemente após várias tentativas,
    // os comandos subsequentes falharão.
});

// Evento de reconexão
redisClient.on('reconnecting', () => {
    console.warn('🔄 Tentando reconectar ao Redis...');
});

// Evento de desconexão
redisClient.on('end', () => {
    console.log('🔌 Conexão com o Redis encerrada.');
});
/*
// Opcional: Função para fechar a conexão de forma graciosa ao encerrar a aplicação
async function closeRedisConnection() {
    if (redisClient.status === 'ready' || redisClient.status === 'connecting' || redisClient.status === 'reconnecting') {
        console.log('🔌 Encerrando conexão com o Redis...');
        await redisClient.quit();
    }
}

// Você pode querer chamar closeRedisConnection em eventos de encerramento do processo
process.on('SIGINT', closeRedisConnection);
process.on('SIGTERM', closeRedisConnection);
*/

// Exporta o cliente Redis para ser usado em outras partes do código
export { redisClient }