import type { Request, Response } from 'express';
import { generateToken } from './tokenService.ts';

// 1. Função: Conectar Steam a conta existente
// export const connectSteamToAccount = async (req: Request, res: Response) => {
//     try {
//         const { steamId, email } = req.body;

//         if (!steamId || !email) {
//             return res.status(400).json({ message: 'SteamId e email são obrigatórios' });
//         }

//         const user = await prisma.user.findUnique({
//             where: { email },
//             include: { profile: true },
//         });

//         if (!user) {
//             return res.status(404).json({ message: 'Usuário com este email não encontrado' });
//         }

//         const existingSteam = await prisma.user.findUnique({
//             where: { steamId },
//         });

//         if (existingSteam && existingSteam.email !== email) {
//             return res.status(400).json({ message: 'Esta Steam já está vinculada a outra conta' });
//         }

//         // Se tiver a função getSteamProfile, pode usa-la aqui
//         // const steamProfile = await getSteamProfile(steamId);

//         const updatedUser = await prisma.user.update({
//             where: { email },
//             data: {
//                 steamId: steamId,
//                 // profile: { update: { avatar: steamProfile.avatar } }
//             },
//         });

//         console.log(`Steam conectada ao usuário ${email}: ${steamId}`);
//         const token = generateToken(updatedUser);

//         return res.status(200).json({ message: 'Steam conectada com sucesso', user: updatedUser, token });
//     } catch (err: Error | unknown) {
//         console.error('Erro ao conectar Steam:', err);
//         return res.status(500).json({ message: err.message });
//     }
// };

// 2. Função: Autenticação via Passport (A que estava faltando!)
export const steamAuth = (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // req.user tipicamente vem populado pelo middleware do Passport
    const token = generateToken(req.user);

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    res.redirect(`${process.env.CLIENT_URL}/`);
};

// 2. Função: Autenticação via Passport (A que estava faltando!)
export const steamMobile = (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // req.user tipicamente vem populado pelo middleware do Passport
    const token = generateToken(req.user);

    res.redirect(`${process.env.MOBILE_SCHEME}://auth/callback?token=${encodeURIComponent(token)}`);
};
