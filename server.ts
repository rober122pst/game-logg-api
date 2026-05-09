import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';

import routes from './src/routes/routes.ts';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import './src/config/passport.ts';

import { errorHandler } from './src/middlewares/errorHandler.ts';

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(errorHandler);
// Sessions
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'uma_senha_qualquer',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: process.env.NODE_ENV === 'production' }, // secure true apenas em produção com HTTPS
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.use(routes);

if (!process.env.MONGODB_KEY) {
    console.error('MONGODB_KEY is not defined in environment variables');
    process.exit(1);
}

//  conexão MongoDB
mongoose
    .connect(process.env.MONGODB_KEY)
    .then(() => console.log('Connected to Database'))
    .catch((err) => console.error('Erro MongoDB:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
