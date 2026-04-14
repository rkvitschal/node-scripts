// Inclusão do Express 
import express from 'express';

////
import passport from 'passport';
import { requireAuth } from '../src/passport/middleware.js';
import jwt from 'jsonwebtoken';


const router = express.Router();
// Ligamos o middleware de parsing de JSON para esta rota, garantindo que req.body esteja disponível
router.use(express.json());

// Ferramenta de iniciar o Passport e carregar as estratégias
// Usar nas rotas que precisam de autenticação, ou globalmente se a maioria das rotas exigir autenticação.
// Se for usar globalmente, pode ser colocado no arquivo principal do Express (ex: app.js) para garantir que todas as rotas tenham acesso ao Passport e às estratégias configuradas.
setupPassport(app, [localStrategy, jwtStrategy]);

// Exemplo de inicialização do Passport só com a Strategy local.
//setupPassport(app, [localStrategy]);


// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================

// Rota de Login usando a Strategy Local com cookie
router.post('/login', passport.authenticate('local', { session: true }), (req, res) => {
  // O usuário passou pela validação (email/senha ok). req.user existe agora.
  
  return res.json({ message: 'Login bem sucedido', user: req.user });
  
});

// Rota de Login usando a Strategy Local com Tokens JWT (sem sessão)
router.post('/login-token', passport.authenticate('local', { session: false }), (req, res) => {
  // O usuário passou pela validação (email/senha ok). req.user existe agora.
 
  // ABORDAGEM 2: JWT (Access e Refresh)
  const accessToken = jwt.sign(
    { sub: req.user.id }, 
    process.env.JWT_ACCESS_SECRET || 'seu_segredo_super_seguro', 
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { sub: req.user.id }, 
    process.env.JWT_REFRESH_SECRET || 'segredo_refresh', 
    { expiresIn: '7d' }
  );

  // Aqui você salvaria o refreshToken no banco/Redis atrelado ao usuário

  return res.json({
    message: 'Login bem sucedido',
    accessToken,
    refreshToken
  });
});





router.post('/refresh', (req, res) => {
    // Em uma API REST padrão, recebemos pelo body. 
    // Se for uma aplicação web, é mais seguro ler de req.cookies.refreshToken
    // Interessante aplicar regra de blacklist de tokens no banco/Redis para evitar uso indevido de refresh tokens roubados.
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh Token não fornecido.' });
    }

    try {
        // 1. Verifica se o token é válido e não expirou
        const payload = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || 'segredo_refresh'
        );

        // 2. (Recomendado) Validação no Banco de Dados ou Redis
        // Aqui você buscaria no banco para saber se o token não foi revogado
        // Exemplo: const tokenAtivo = await db.findRefreshToken(payload.sub, refreshToken);
        // if (!tokenAtivo) throw new Error('Token revogado');

        // 3. Gera um NOVO Access Token
        const newAccessToken = jwt.sign(
            { sub: payload.sub },
            process.env.JWT_ACCESS_SECRET || 'seu_segredo_super_seguro',
            { expiresIn: '15m' }
        );

        // ==========================================
        // ROTAÇÃO DE REFRESH TOKEN (Opcional, mas muito seguro)
        // ==========================================
        // Em sistemas mais rígidos, você também gera um NOVO Refresh Token aqui,
        // invalida o antigo no banco, e devolve ambos para o cliente.
        // Isso evita que um Refresh Token roubado seja usado infinitamente.

        return res.json({
            message: 'Token atualizado com sucesso',
            accessToken: newAccessToken,
            // refreshToken: newRefreshToken // Caso decida implementar a rotação
        });

    } catch (error) {
        // O erro cai aqui se o token for inválido, adulterado ou se já tiver expirado.
        // O status 403 (Forbidden) indica ao front-end que a única saída é forçar o login novamente.
        return res.status(403).json({
            error: 'Refresh Token inválido ou expirado. Por favor, faça login novamente.'
        });
    }
});

// ==========================================
// ROTA DE VALIDAÇÃO DE SESSÃO / TOKEN
// ==========================================
router.get('/validate', requireAuth, (req, res) => {
    // Se o código chegou até aqui, o middleware 'requireAuth' já confirmou 
    // que o token (ou a sessão) é perfeitamente válido e não expirou.

    // O Passport também já injetou as informações do usuário no req.user
    return res.json({
        valid: true,
        user: req.user
    });
});

router.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        //res.redirect('/login');
    });
});


// Exemplo de rota com middleware de autenticação. Somente acessível se o usuário tiver uma sessão válida ou um token JWT válido.

router.get('/dashboard', requireAuth, (req, res) => {
    // Passou pelo middleware! Temos req.user garantido.
    res.json({ message: 'Bem vindo ao painel!', user: req.user });
});

export default router;