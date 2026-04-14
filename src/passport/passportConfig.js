// Importação de passport e session
import passport from 'passport';
import session from 'express-session';

import { query } from "../database/pg.js";

import RedisStore from 'connect-redis';
import redisClient from '../database/redis.js';

/**
 * Configuração Global do Passport
 * @param {Object} app - Instância do Express
 * @param {Array} strategies - Array de estratégias configuradas
 */
const setupPassport = (app, strategies = []) => {

  app.use(
    session({
      store: new RedisStore({ client: redisClient, prefix: process.env.SESSION_PREFIX || 'session:' }), // Exemplo de configuração do Redis
      secret: process.env.SESSION_SECRET || 'seu_segredo_super_secreto_para_sessions', // Substitua por um segredo forte
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }, // 1 dia
    })
  );

  // Inicializa o Passport no Express
  app.use(passport.initialize());
  // Se for usar Sessões, precisa desta linha:
  app.use(passport.session());
  // Serialização genérica: Salva apenas o ID do usuário na sessão
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Desserialização: Aqui você integraria com seu DB (PostgreSQL/Mongo)
  // Lembrando que a cada requisição do usuário autenticado, o Passport irá chamar esta função para obter os dados do usuário a partir do ID armazenado na sessão.
  // O que pode gerar fluxo elevado de consultas ao banco, então é importante otimizar essa consulta ou usar caching se necessário.
  passport.deserializeUser(async (id, done) => {
    try {
      // Exemplo genérico: substitua pela busca no seu banco
      // Adaptar com o melhor fluxo para sua aplicação
      const sql = 'SELECT * FROM usuario WHERE usuario_id = $1';
      const values = [id];
      const result = await query(sql, values);

      if (!result.rows.length) {
        console.log(`[WARN] Desserialização falhou. Usuário com ID ${id} não encontrado.`);
        return done(null, false);
      }
      const user = { id, name: result.rows[0].nome, email: result.rows[0].email }; // Mock
      console.log(`[INFO] Desserializando usuário com ID: ${id}`);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Carrega todas as estratégias passadas no array
  strategies.forEach(strategy => passport.use(strategy));
};

export { setupPassport };