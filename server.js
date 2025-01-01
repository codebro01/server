import 'dotenv/config'
import 'express-async-error';
import express from 'express';
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
import { KogiLga } from './models/LgaSchema.js';
import { PrimarySchools } from './models/schoolsSchema.js';
import sanitizeHtml from 'sanitize-html';
import { Wards } from './models/LgaSchema.js';
import { wards } from './routes/index.js';


const app = express();

const allowedOrigin = ['http://localhost:3000'];


app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigin.includes(origin)) {
            callback(null, true)
        }
        else {
            callback(new Error('Not allowed by CORS......'))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'], // Ensure these headers are allowed
}))




app.use(cookieParser(process.env.JWT_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.JWT_SECRET, // Replace with a strong, secure key
        resave: false, // Prevents saving session if it wasn't modified
        saveUninitialized: false, // Only save sessions that have data
        cookie: {
            httpOnly: true, // Helps prevent XSS attacks
            secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
            maxAge: 1000 * 60 * 60 * 24, // 1 day expiration
            sameSite: 'Lax', // Adjust based on your needs (None, Lax, Strict)
        },
    })
)


app.get('/api/v1', async (req, res) => {
    const wards = await Wards.find({});
    console.log(wards)
    res.send(wards)
})
app.use('/api/v1/admin-admin', adminAuthRouter)
app.use('/api/v1/admin-enumerator', registrarAuthRouter)
app.use('/api/v1/student', authMiddleware, studentsRouter)
app.use('/api/v1/all-schools', allSchoolsRouter)
app.use('/api/v1/wards', wards)

const PORT = process.env.PORT || 3100;

app.use(notFound);
app.use(customErrorHandler);


async function processExcelData() {



    try {

        // Step 1: Read the Excel file
        const workbook = XLSX.readFile('./files/wards.xlsx');

        // Step 2: Extract sheet names and ward data
        const workSheetsFromFile = workbook.SheetNames.map((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Get data as an array of arrays

            // Assuming the ward names are in the first column (index 0)
            const wards = sheetData.map(row => row[0]);

            return { sheetName, wards };
        });
        await Wards.deleteMany({});
        // Step 3: Save each sheet's ward data to MongoDB
        for (const sheet of workSheetsFromFile) {
            const wards = sheet.wards;

            // Create and save the ward documents to MongoDB
            for (const wardName of wards) {
                const ward = new Wards({
                    name: wardName,
                });
                console.log(wardName)
                await ward.save();
                console.log(`Ward '${wardName}' saved successfully.`);
            }
        }

        console.log('All wards uploaded successfully!')
    } catch (error) {
        console.error('Error processing data:', error);
    }
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
    //   // Read the Excel file
    //   const workbook = XLSX.readFile('./files/primary2.xlsx');


    //     // Access the first sheet
    //     const sheet = workbook.Sheets[workbook.SheetNames[0]];

    //     // Parse the sheet data into JSON format, treating the first row as headers
    //     const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    //     // Extract headers from the first row
    //     const [headers, ...rows] = data;

    //     // Map each row into an object using the headers
    //     const mappedData = rows.map(row =>
    //         headers.reduce((acc, header, index) => {
    //             acc[header] = row[index];
    //             return acc;
    //         }, {})
    //     );
    //     // Iterate over the mapped data and process it
    //     for (let index = 0; index < mappedData.length; index++) {
    //         const record = mappedData[index];

    //         const schoolData = {
    //             schoolCode: cleanText(record['schoolCode']),    // Directly use the header key
    //             schoolName: cleanText(record['schoolName']),    // Directly use the header key
    //             schoolType: cleanText(record['schoolType']),    // Directly use the header key
    //             LGA: cleanText(record['LGA']),                  // Directly use the header key
    //             schoolCategory: cleanText(record['schoolCategory']) // Directly use the header key
    //         };

    //         // Save the data to the database
    //         const newSchool = new PrimarySchools(schoolData);
    //         // console.log(newSchool)
    //         await newSchool.save();

    //         // Log the index and the school name that was saved
    //         console.log(`Index ${index}: School "${schoolData.schoolName}" saved successfully`);
    //     }
    // } catch (error) {
    //   console.error('Error processing data:', error);
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



