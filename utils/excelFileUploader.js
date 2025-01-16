import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const XLSXUploader = (req, res, next) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).send('No file uploaded.');
        }


        const uploadDir = path.join(__dirname, 'uploads');

        // Ensure the uploads directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Save the file buffer to the uploads directory
        const filePath = path.join(uploadDir, req.file.originalname);
        fs.writeFileSync(filePath, req.file.buffer);

        // Read the Excel file
        const workbook = XLSX.readFile(filePath);

        // Convert the first sheet to JSON
        const sheetName = workbook.SheetNames[0];
        let sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }); // Read as 2D array

        // Remove the first two rows
        sheetData = sheetData.slice(2);

        // Remove the first column from each row
        sheetData = sheetData.map(row => row.slice(1));

        // Convert back to an array of objects
        const headers = sheetData[0]; // First row as headers
        const data = sheetData.slice(1).map(row => {
            return row.reduce((acc, value, index) => {
                acc[headers[index]] = value;
                return acc;
            }, {});
        });


        req.parsedData = data;

        next();
    } catch (error) {
        console.error('Error processing file:', error.message);
        return next(error);
    }
};
