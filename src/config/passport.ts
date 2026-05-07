import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as SteamStrategy } from 'passport-steam';
import dotenv from 'dotenv';
import passport from 'passport';
import { prisma } from '../prisma.ts';

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || 'google-client-id',

            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'google-client-secret',

            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
        },

        async (accessToken, refreshToken, profile, done) => {
            const newUser = {
                googleId: profile.id,

                username: profile.name?.givenName.toLowerCase() || `guest${profile.id}`,
            };

            const email = profile.emails?.[0]?.value;

            const newProfile = {
                displayName: profile.displayName,

                avatar: profile.photos?.[0]?.value || null,
            };

            try {
                let user = await prisma.user.findUnique({ where: { googleId: profile.id } });

                if (user) {
                    return done(null, user);
                }

                if (!email) return done(new Error('Email not found in Google profile'), false);

                user = await prisma.user.findUnique({ where: { email } });

                if (user) {
                    user.googleId = profile.id;

                    return done(null, user);
                }

                user = await prisma.user.create({
                    data: {
                        ...newUser,

                        email,

                        profile: {
                            create: { ...newProfile },
                        },
                    },
                });

                done(null, user);
            } catch (err) {
                console.error(err);

                done(err, false);
            }
        }
    )
);

const steamReturnUrl = process.env.STEAM_RETURN_URL || 'http://localhost:3000/auth/steam/callback';

const steamRealm = new URL(steamReturnUrl).origin + '/';

passport.use(
    new SteamStrategy(
        {
            returnURL: steamReturnUrl,

            realm: steamRealm,

            apiKey: process.env.STEAM_KEY || 'steam-api-key',

            stateless: true,
        },

        async (identifier, profile, done) => {
            try {
                const steamId = profile._json.steamid;

                let user = await prisma.user.findUnique({ where: { steamId } });

                if (!user) {
                    const username = profile.displayName
                        .toLowerCase()
                        .replace(/\s+/g, '')
                        .replace(/[^a-z0-9_]/g, '');

                    user = await prisma.user.create({
                        data: {
                            steamId,

                            username: `${username}_${steamId.slice(-6)}`,

                            profile: {
                                create: {
                                    displayName: profile.displayName,

                                    avatar: profile._json.avatarfull,

                                    links: [{ name: 'STEAM', url: profile._json.profileurl }],
                                },
                            },
                        },
                    });
                }

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });

        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;
