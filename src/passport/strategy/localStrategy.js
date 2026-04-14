import { Strategy as LocalStrategy } from "passport-local";
import { query } from "../../database/pg.js";
import argon2 from 'argon2';

export default new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password',
    },
    async (email, password, done) => {
        try {

            // Exemplo fictício de busca no banco de dados usando PostgreSQL. Substitua isso pela sua lógica real de acesso ao banco.
            const sql = 'SELECT * FROM usuario WHERE email = $1';
            const values = [email];
            const result = await query(sql, values);

            if (!result.rows.length) {
                console.log(`[WARN] Tentativa de login com email não cadastrado: ${email}`);
                return done(null, false, { message: 'Usuário não encontrado.' });
            } else {
                console.log(`[INFO] Tentativa de login com email: ${email}`);
            }

            // Nesse exemplo estamos usando argon2 para verificar a senha. Certifique-se de que as senhas estão sendo armazenadas usando argon2 no banco de dados.
            if (await argon2.verify(result.rows[0].senha_hash, password)) {
                console.log(`[INFO] Senha correta para email: ${email}`);
            } else {
                console.warn(`[WARN] Senha incorreta para email: ${email}`);
                return done(null, false, { message: 'Senha incorreta.' });
            }
            // Nesse exemplo, estamos retornando um objeto de usuário simples. Na prática, você pode querer retornar um objeto mais completo com as informações do usuário.
            const user = { id: result.rows[0].usuario_id }; // Mock
            // Se tudo der certo, retorna o usuário. O Passport injetará isso em req.user
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
);