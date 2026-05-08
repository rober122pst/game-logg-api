import jwt from 'jsonwebtoken';
import type { User } from '../../generated/prisma/client.ts';

//                  Gerar JWT
export const generateToken = (user: User | Pick<User, 'id' | 'username' | 'role'>) => {
    return jwt.sign({ id: user.id, name: user.username, role: user.role }, process.env.JWT_SECRET || 'default_secret', {
        expiresIn: '7d',
    });
};
