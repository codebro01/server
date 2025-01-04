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




// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests, please try again later.",
    headers: true,
});

// app.use(helmet());

const allowedOrigin = ['http://localhost:3000', 'https://server-g10x.onrender.com', 'https://calm-stardust-05aabe.netlify.app'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigin.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'], // Ensure these headers are allowed
}));


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
    res.send('Welcome to kogi agile api')
})

// app.get('/api/v1', async (req, res) => {
//     const wards = await Wards.find({});
//     console.log(wards)
//     res.send(wards)
// })
app.use('/api/v1/admin-admin', adminAuthRouter)
app.use('/api/v1/admin-enumerator', registrarAuthRouter)
app.use('/api/v1/student', authMiddleware, studentsRouter)
app.use('/api/v1/all-schools', allSchoolsRouter)
app.use('/api/v1/wards', wards)

const PORT = process.env.PORT || 3100;

app.use(notFound);
app.use(customErrorHandler);


async function processExcelData() {




    // const cleanText = (text) => {
    //     if (typeof text === 'string') {
    //         return sanitizeHtml(text, {
    //             allowedTags: [], // Remove all HTML tags
    //             allowedAttributes: {}, // Remove all attributes
    //         }).trim(); // Also trim whitespace
    //     }
    //     return text; // Return as-is if not a string
    // };
    // try {
    //     // Read the Excel file
    //     const workbook = XLSX.readFile('./files/KOGI AGILE LGA ENUMERATORS LIST-2.xlsx');

    //     const sheet = workbook.Sheets[workbook.SheetNames[0]];
    //     const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    //     const [headers, ...rows] = data;
    //     const trimmedHeaders = headers.map(header => header.trim());
    //     const registrarRole = await Roles.findOne({ role: 'registrar' });

    //     const mappedData = rows.map(row =>
    //         trimmedHeaders.reduce((acc, header, index) => {
    //             acc[header] = row[index];
    //             return acc;
    //         }, {})
    //     );
    //     const registrarStore = [];
    //     for (let index = 0; index < mappedData.length; index++) {
    //         const record = mappedData[index];
    //         const generatedRandomId = generateRandomId();

    //         const registrarData = {
    //             fullName: cleanText(record['fullName']),
    //             lga: cleanText(record['lga']),
    //             email: cleanText(record['email']),
    //             accountNumber: cleanText(record['accountNumber']),
    //             bankName: cleanText(record['bankName']),
    //             password: "123456",
    //             permissions: [registrarRole.permissions],
    //             roles: [registrarRole._id],
    //             passport: "https://res.cloudinary.com/dadzk0ffu/image/upload/v1735440797/admin_passport/kw0eqyvn4fzamhkkjsoy.png",
    //             randomId: generatedRandomId,
    //             phone: `+123456789${Math.floor(1000 + Math.random() * 9000)}`
    //         };

    //         await Registrar.deleteMany({});


    //         registrarStore.push(registrarData);
    //         // Log the index and the school name that was saved
    //         console.log(`Index ${index}: Registrar "${registrarData.fullName}" saved successfully`);
    //     }

    //     for(const singleRegistrar of registrarStore) {
    //         const newRegistrar = new Registrar(singleRegistrar);
    //         await newRegistrar.save();
    //     }

    //     console.log('registrar all saved')

    // } catch (error) {
    //     console.error('Error processing data:', error);
    // }



}

const startDB = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(PORT, () => {
            console.log('app connected to port:' + PORT)
        })



        // processExcelData();

    }
    catch (err) {
        console.error('An error occured connecting to the DB')
        console.error(err)
    }
}
startDB();

// Function to process data and save to database



