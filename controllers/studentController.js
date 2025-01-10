import { Student, Permissions, Registrar } from '../models/index.js'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError, NotFoundError, NotAuthenticatedError } from "../errors/index.js";
import { addLogToUser } from "../utils/index.js";
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { generateStudentsRandomId } from '../utils/index.js';




const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



export const getAllStudents = async (req, res, next) => {
    try {
        await Student.syncIndexes();

        const { userID, permissions } = req.user;
        //  if(!userID) return next(new NotAuthenticatedError('Not authorized to get students'));

        const { ward, schoolId, lga, presentClass, sortBy, sortOrder, nationality, state, enumerator, dateFrom, dateTo, year, yearOfAdmission, classAtEnrollment, yearOfEnrollment } = req.query;

        // Create a basket object
        const { } = req.user
        let basket;

        if (!permissions.includes('handle_registrars')) {
            basket = { createdBy: userID };
        } else {
            basket = {};
        }
        if (lga) basket.lga = lga;
        if (presentClass) basket.presentClass = presentClass;
        if (classAtEnrollment) basket.classAtEnrollment = classAtEnrollment;
        if (yearOfEnrollment) basket.yearOfEnrollment = yearOfEnrollment;
        if (ward) basket.ward = ward;
        if (schoolId) basket.schoolId = schoolId;
        if (nationality) basket.nationality = nationality;
        if (state) basket.stateOfOrigin = state;
        if (enumerator) basket.createdBy = enumerator;
        if (dateFrom || dateTo) {
            basket.createdAt = {};
            if (dateFrom) basket.createdAt.$gte = new Date(dateFrom);
            if (dateTo) basket.createdAt.$lte = new Date(dateTo);
        }
        if (year) basket.year = year;
        if (yearOfAdmission) basket.yearAdmitted = yearOfAdmission;



        let sort = { createdAt: -1 }; // Default sort

        if (sortBy && sortOrder) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }



        const students = await Student.find(basket).populate('schoolId').populate('ward').sort(sort).collation({ locale: "en", strength: 2 }).lean();


        return res.status(StatusCodes.OK).json({ students, totalStudents: students.length });
    }
    catch (err) {
        console.log(err)
    }
}

export const filterAndDownload = async (req, res, next) => {

    try {
        await Student.syncIndexes();

        const { userID, permissions } = req.user;

        const { ward, schoolId, lga, presentClass, sortBy, sortOrder, nationality, stateOfOrigin, enumerator, dateFrom, dateTo, yearOfAdmission, yearOfEnrollment } = req.query;

        // Create a basket object
        let basket;
        if (!permissions.includes('handle_registrars')) {
            basket = { createdBy: userID };
        } else {
            basket = {};
        }
        if (lga) basket.lgaOfEnrollment = lga;
        if (presentClass) basket.presentClass = presentClass;
        if (yearOfEnrollment) basket.yearOfEnrollment = yearOfEnrollment;
        if (ward) basket.ward = ward;
        if (schoolId) basket.schoolId = schoolId;
        if (nationality) basket.nationality = nationality;
        if (stateOfOrigin) basket.stateOfOrigin = stateOfOrigin;
        if (enumerator) basket.createdBy = enumerator;
        if (dateFrom || dateTo) {
            basket.createdAt = {};

            // Handle dateFrom
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                if (isNaN(fromDate)) {
                    return next(new BadRequestError('Invalid dateFrom format'));
                }
                basket.createdAt.$gte = fromDate;
            }

            // Handle dateTo
            if (dateTo) {
                const toDate = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
                if (isNaN(toDate)) {
                    return next(new BadRequestError('Invalid dateTo format'));
                }
                basket.createdAt.$lte = toDate;
            }

            // Clean up empty `createdAt` filter
            if (Object.keys(basket.createdAt).length === 0) {
                delete basket.createdAt;
            }
        }

        // if (yearOfAdmission) basket.yearAdmitted = yearOfAdmission;

        let sort = { createdAt: -1 }; // Default sort
        if (sortBy && sortOrder) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }

        console.log(basket.createdAt)

        const students = await Student.find(basket).populate('schoolId').populate('ward').populate('createdBy').sort(sort).collation({ locale: "en", strength: 2 }).lean();

        if (students.length < 1) {
            return next(new NotFoundError("No students with the filtered data provided"));
        };

        // const allKeys = new Set();
        // students.forEach(student => {
        //     Object.keys(student).forEach(key => allKeys.add(key));
        // });

        const orderedHeaders = [
            "_id",
            'schoolId',
            'surname',
            'otherNames',
            'gender',
            'dob',
            'presentClass',
            'nationality',
            'stateOfOrigin',
            'lga',
            'studentNin',
            'lgaOfEnrollment',
            "ward",
            'communityName',
            'residentialAddress',
            'yearOfEnrollment',
            'parentName',
            'parentPhone',
            'parentOccupation',
            'parentNin',
            'parentBvn',
            'bankName',
            'accountNumber',
            'lastLogged',
            'createdAt',
            'createdBy'
        ];

        const headers = orderedHeaders.filter(header => students.some(student => student.hasOwnProperty(header)));

        let count = 1;
        const formattedData = students.map(student => {
            const row = {};
            headers.forEach(header => {
                // Populate fields like _id, schoolId, ward, createdBy with actual readable data
                if (header === '_id') {
                    row[header] = count++; // Ensure _id is a string
                } else if (header === 'createdBy' && student[header]) {
                    row[header] = student[header].fullName || ''; // Assuming 'name' is a field in the 'createdBy' collection
                } else if (student[header] && header === 'schoolId') {
                    row[header] = student[header].schoolName || ''; // Assuming 'name' is a field in the 'createdBy' collection
                } else if (student[header] && header === 'randomId') {
                    student[header] && header === ''
                    row[header] = ''; // Assuming 'name' is a field in the 'createdBy' collection

                } else {
                    row[header] = student[header] || ''; // Handle regular fields
                }
            });
            return row;
        });

        // Create a workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

        // Create a buffer for the Excel file
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Create a readable stream from the buffer
        const stream = Readable.from(buffer);

        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename=students.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Pipe the stream to the response
        stream.pipe(res);

        // Optional: Handle error during streaming
        stream.on('error', (err) => {
            console.error('Stream error:', err);
            res.status(500).send('Error generating file');
        });

        // End the response once the stream is finished
        stream.on('end', () => {
            console.log('File sent successfully');
        });

    } catch (err) {
        return next(err);
        console.log(err);
    }
};

export const filterEnumeratorsByStudents = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // Initialize the filter object
        const filter = {};

        // Add date range filters if provided
        if (startDate) {
            filter.createdAt = { $gte: new Date(startDate) };
        }
        if (endDate) {
            filter.createdAt = filter.createdAt || {}; // Ensure createdAt exists
            filter.createdAt.$lte = new Date(endDate);
        }

        // Filter by enumeratorId if provided


        // Query the database with the constructed filter
        const students = await Student.find(filter).populate('createdBy').limit(20);

        return res.status(200).json({
            count: students.length,
            students,
        });
    } catch (error) {
        return next(error);
    }

}

export const downloadAttendanceSheet = async (req, res, next) => {
    try {
        const { userID } = req.user;
        const filterBasket = { createdBy: userID };
        const { schoolId } = req.query;

        if (schoolId) filterBasket.schoolId = schoolId;

        const students = await Student.find(filterBasket).populate('schoolId').populate("ward");

        if (!students.length) {
            return next(new NotFoundError(`We can't find students registered by you in this particular school`));
        }
        const count = 1;
        // Prepare data for the sheet
        const schoolName = students[0]?.schoolId?.schoolName || 'Unknown School';
        const formattedData = students.map(student => ({
            'S/N': count++,
            StudentId: student.randomId,
            Surname: student.surname || '',
            'Other Names': student.otherNames || '',
            Class: student.presentClass || "",
            'Week 1': '',
            'Week 2': '',
            'Week 3': '',
            'Week 4': '',
            'Week 5': '',
        }));

        // Create the sheet with headers
        const rows = [
            [schoolName],                // Big header (School Name)
            [],                         // Blank row for spacing
            ['StudentId', 'Surname', 'Other Names', 'Class', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'], // Column headers
            ...formattedData.map(row => Object.values(row)) // Data rows
        ];

        // Create a workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(rows);

        // Merge cells for the major header (School Name)
        worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]; // Merge A1:D1

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

        // Instead of writing the file to disk, we stream the content to the client
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Create a readable stream from the buffer
        const stream = Readable.from(buffer);

        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename=students.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Pipe the stream to the response
        stream.pipe(res);

        // Optional: Handle error during streaming
        stream.on('error', (err) => {
            console.error('Stream error:', err);
            res.status(500).send('Error generating file');
        });

        // End the response once the stream is finished
        stream.on('end', () => {
            console.log('File sent successfully');
        });

    } catch (error) {
        next(error);
    }
};

export const createStudent = async (req, res, next) => {
    try {
        // await Student.deleteMany({});
        const randomId = generateStudentsRandomId();
        console.log(randomId)
        const uploadedImage = req.uploadedImage;
        if (!uploadedImage) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "No uploaded image found" });
        }
        const { secure_url } = uploadedImage;
        const { userID } = req.user;
        // const optional = req.body.ward || "others"
        const student = new Student({ ...req.body, createdBy: userID, passport: secure_url, randomId: randomId })
        await student.save();

        const sessionData = req.session;

        addLogToUser(Registrar, userID, `Enumerator Created student with id: ${student._id}`, req.ip, {
            sessionId: sessionData.id || 'unknown',
            sessionCreated: sessionData.cookie._expires,
            data: sessionData, // Add any relevant session details
        });

        res.status(StatusCodes.OK).json({ student })
    } catch (error) {
        next(error)
    }
}



export const deleteStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const student = await Student.findById({ _id: id });
        if (!student) return next(new NotFoundError('There is no student with id: ' + id));
        const deletedStudent = await Student.findByIdAndDelete({ _id: id });
        if (!deletedStudent) return next(new Error('An Error while trying to delete student'))
        res.status(StatusCodes.OK).json({ deletedStudent: deletedStudent });
    } catch (error) {
        next(error)
    }
}


export const updateStudent = async (req, res, next) => {
    try {
        if (req.file && req.uploadedImage) {
            const { secure_url } = req.uploadedImage;
        }
        // if (!uploadedImage) {
        //     return res.status(StatusCodes.BAD_REQUEST).json({ error: "No uploaded image found" });
        // }

        const { permissions } = req.user;


        const { id } = req.params;
        const student = await Student.findById({ _id: id });
        if (!student) return next(new NotFoundError('There is no student with id: ' + id));


        if (!permissions.includes('handle_registrars')) {
            const registrationTime = new Date(student.createdAt);
            const currentTime = new Date();

            const timeDifference = (currentTime - registrationTime) / (1000 * 60 * 60);

            if (timeDifference < 5) {
                const updatedStudent = await Student.findByIdAndUpdate({ _id: id }, { ...req.body }, { new: true, runValidators: true });
                if (!updatedStudent) return next(new Error('An Error while trying to delete student'))
                return res.status(StatusCodes.OK).json({ updatedStudent: updatedStudent });

            }

            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Students can only be updated after first 5 hours of registration" });

        }


        const updatedStudent = await Student.findByIdAndUpdate({ _id: id }, { ...req.body, passport: secure_url }, { new: true, runValidators: true });
        if (!updatedStudent) return next(new Error('An Error while trying to delete student'))
        res.status(StatusCodes.OK).json({ updatedStudent: updatedStudent });
    } catch (error) {
        next(error)
    }
}