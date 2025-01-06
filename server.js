import 'dotenv/config'
import 'express-async-error';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import xssClean from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import csurf from 'csurf';
import morgan from 'morgan';
import enforceSSL from 'express-enforces-ssl';
import { connectDB } from './db/connectDB.js';
import { notFound } from './middlewares/notFoundMiddleware.js';
import { customErrorHandler } from './middlewares/errorMiddleware.js';
import cookieParser from 'cookie-parser'
import { adminAuthRouter, registrarAuthRouter, studentsRouter, allSchoolsRouter } from './routes/index.js';
import { authMiddleware, authorizePermission } from './middlewares/authenticationMiddleware.js';
import session from 'express-session';
import cors from 'cors';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import { Registrar } from './models/registrarSchema.js';
import sanitizeHtml from 'sanitize-html';
import { wards } from './routes/index.js';
import { Roles } from './models/rolesSchema.js';
import { generateRandomId } from './utils/generateRandomId.js';
const app = express();
import { KogiLga } from './models/LgaSchema.js';
import { Schools, PrimarySchools, AllSchools } from './models/schoolsSchema.js';


// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests, please try again later.",
    headers: true,
});

// app.use(helmet());

// app.options('*', cors()); // Preflight requests




const allowedOrigins = [
    'http://localhost:3000',
    'https://server-g10x.onrender.com',
    'https://calm-stardust-05aabe.netlify.app',
    'https://kogi-agile-app-vite.vercel.app',
    'https://server-nu-khaki-78.vercel.app',
    'https://miscct.kogiagile.org',
    'https://server-e1e8.onrender.com'
];

// CORS middleware
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Handle preflight requests
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        return res.sendStatus(204);
    }
    next();
});


app.use(cookieParser(process.env.JWT_SECRET));
app.use(express.json());
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Set 'secure' in production
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        sameSite: 'Lax', // Prevent CSRF
    },
}));


//Routes 

app.get('/', (req, res) => {
    res.send('Welcome to kogi agile api........')
})
app.get('/lgas', async (req, res) => {
    const kogilgas = await KogiLga.find({});
    res.json({ kogilgas })
})

app.use('/api/v1/admin-admin', adminAuthRouter)
app.use('/api/v1/admin-enumerator', registrarAuthRouter)
app.use('/api/v1/student', authMiddleware, studentsRouter)
app.use('/api/v1/all-schools', allSchoolsRouter)
app.use('/api/v1/wards', wards);


app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

const PORT = process.env.PORT || 3100;

app.use(notFound);
app.use(customErrorHandler);


const startDB = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        // const primary = await PrimarySchools.find({});
        // const secondary = await Schools.find({});

        // const allSchools = [...primary, ...secondary];

        // await AllSchools.insertMany(allSchools);


        app.listen(PORT, () => {
            console.log('app connected to port:' + PORT)
        })

    }
    catch (err) {
        console.error('An error occured connecting to the DB')
        console.error(err)
    }
}
startDB();




