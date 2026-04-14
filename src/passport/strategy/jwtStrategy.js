import { Strategy as JwtStrategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';

const opts = {
  // Extrai o token do header 'Authorization: Bearer <token>'
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_ACCESS_SECRET || 'seu_segredo_super_seguro',
};

export default new JwtStrategy(opts, async (jwt_payload, done) => {
  try {
    // O payload é o que você colocou dentro do token (ex: { sub: user.id })
    // Você pode buscar o usuário no banco aqui, ou apenas confiar no payload
    const user = { id: jwt_payload.sub, role: jwt_payload.role }; 

    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
});