import passport from 'passport';

// Middleware para proteger rotas que exigem autenticação
const requireAuth = (req, res, next) => {
    // 1. Tenta validar via Sessão (Redis/Cookies)
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }

    // 2. Se não tem sessão, tenta validar via JWT
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json({ error: 'Não autorizado. Faça login.' });
        }

        // Injeta o usuário no request para os próximos middlewares usarem
        req.user = user;
        next();
    })(req, res, next);
};

export { requireAuth };