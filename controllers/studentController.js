import { Student, Permissions, Registrar, PayrollSpecialist } from '../models/index.js'
import { PROCESSING, StatusCodes } from 'http-status-codes'
import { BadRequestError, NotFoundError, NotAuthenticatedError } from "../errors/index.js";
import { addLogToUser } from "../utils/index.js";
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs, { copyFileSync } from 'fs';
import { Readable } from 'stream';
import { generateStudentsRandomId } from '../utils/index.js';
import { Attendance } from '../models/index.js';
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';


const client = new MongoClient(process.env.MONGO_URI);






const fetchExistingData = async () => {
    try {
        await client.connect();
        const database = client.db("KOGI_AGILE_DB_TEST");
        const collection = database.collection("scoregrade");

        // Fetch data
        const data = await collection.find({}).toArray();
        return { data }
    } catch (error) {
        console.error("Error accessing data:", error);
        return new Error('an error occured fetching grade')
    } finally {
        await client.close();
    }
}




const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getAllStudents = async (req, res, next) => {
    try {
        await Student.syncIndexes();

        const { userID, permissions } = req.user;
        //  if(!userID) return next(new NotAuthenticatedError('Not authorized to get students'));

        const { ward, schoolId, lgaOfEnrollment, presentClass, nationality, state, enumerator, dateFrom, dateTo, year, yearOfAdmission, classAtEnrollment, yearOfEnrollment } = req.query;

        // Create a basket object
        const { } = req.user
        let basket;
        if (permissions.includes('handle_students') && permissions.length === 1) {
            basket = { createdBy: userID };
        }

        else {
            basket = {};
        }
        if (lgaOfEnrollment) basket.lgaOfEnrollment = lgaOfEnrollment;
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



        const students = await Student.find(basket).populate('schoolId').populate('ward').sort('-updatedAt').collation({ locale: "en", strength: 2 }).lean();


        return res.status(StatusCodes.OK).json({ students, totalStudents: students.length });
    }
    catch (err) {
        console.log(err)
        return next(err)
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

        // console.log(req.url)
        // console.log(req.query)
        // console.log(basket)



        // if (yearOfAdmission) basket.yearAdmitted = yearOfAdmission;

        let sort = { createdAt: -1 }; // Default sort
        if (sortBy && sortOrder) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }


        const students = await Student.find(basket).populate('schoolId').populate('ward').populate('createdBy').sort(sort).collation({ locale: "en", strength: 2 }).lean();

        if (students.length < 1) {
            return next(new NotFoundError("No students with the filtered data provided"));
        };


        // const allKeys = new Set();
        // students.forEach(student => {
        //     Object.keys(student).forEach(key => allKeys.add(key));
        // });
        const orderedHeaders = [
            'S/N',
            'randomId',
            'schoolId',
            'schoolName',
            'surname',
            'firstname',
            'middlename',
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

        const headers = ['S/N', 'studentId', 'schoolId', 'schoolName', ...orderedHeaders.filter(header => header !== 'S/N' && header !== 'schoolName' && students.some(student => student.hasOwnProperty(header)))];


        const uppercaseHeaders = headers.map(header => header.toUpperCase());


        let count = 1;
        const formattedData = students.map(student => {
            const row = {};
            headers.forEach((header, index) => {
                const uppercaseHeader = uppercaseHeaders[index];
                // Populate fields like _id, schoolId, ward, createdBy with actual readable data
                if (header === 'S/N') {
                    row[uppercaseHeader] = count++; // Ensure _id is a string
                } else if (header === 'createdBy' && student[header]) {
                    row[uppercaseHeader] = student[header].fullName?.toUpperCase() || '';
                } else if (student[header] && header === 'schoolId') {
                    row[uppercaseHeader] = student[header].schoolCode?.toUpperCase() || '';
                } else if (student[header] && header === 'randomId') {
                    row['STUDENTID'] = student[header].toUpperCase() || '';
                } else if (header === 'schoolName') {
                    row[uppercaseHeader] = student.schoolId?.schoolName?.toUpperCase() || '';
                } else {
                    row[uppercaseHeader] = student[header]?.toString().toUpperCase() || '';
                }
            });
            return row;
        });


        // Create a workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(formattedData, { header: uppercaseHeaders });

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


export const filterAndView = async (req, res, next) => {

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

        // console.log(req.url)
        // console.log(req.query)
        // console.log(basket)



        // if (yearOfAdmission) basket.yearAdmitted = yearOfAdmission;

        let sort = { createdAt: -1 }; // Default sort
        if (sortBy && sortOrder) {
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }


        const students = await Student.find(basket).populate('schoolId').populate('ward').populate('createdBy').sort(sort).collation({ locale: "en", strength: 2 }).lean();


        res.status(200).json(students);



    } catch (err) {
        console.log(err);
        return next(err);
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
        console.log(req.user)
        const currentUser = await Registrar.findOne({ _id: userID });
        console.log(currentUser)
        const filterBasket = { createdBy: userID };
        const { schoolId } = req.query;

        if (schoolId) filterBasket.schoolId = schoolId;

        const students = await Student.find(filterBasket).populate('schoolId').populate("ward");

        if (!students.length) {
            return next(new NotFoundError(`We can't find students registered by you in this particular school`));
        }
        // Prepare data for the sheet
        let count = 1;
        const schoolName = students[0]?.schoolId?.schoolName || 'Unknown School';
        const formattedData = students.map(student => ({
            "S/N": count++,
            StudentId: student.randomId,
            Surname: student.surname || '',
            'Middlename': student.middlename || '',
            'Firstname': student.firstname || '',
            Class: student.presentClass || "",
            'Attendance Score': '',
        }));

        // Create the sheet with headers
        const rows = [
            [schoolName],                // Big header (School Name)
            [],                         // Blank row for spacing
            ['S/N', 'StudentId', 'Surname', 'Firstname', 'Middlename', 'Class', 'AttendanceScore'], // Column headers
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
        return next(error);
    }
};

export const uploadAttendanceSheet = async (req, res, next) => {
    // const scoreRange = await 


    try {

        const existingData = await fetchExistingData();
        console.log(existingData);
        const { userID } = req.user;
        const { week, month, year } = req.body;


        let attendance;

        for (const existingStudents of req.parsedData) {

            attendance = await Attendance.find({ studentRandomId: existingStudents.StudentId, attdWeek: week, month, year });
            console.log(attendance)

        }


        const minLength = 20;
        const maxLength = 25;

        const attendanceRecords = [];
        let insertionCount = 0;
        for (const row of req.parsedData) {
            const isExist = await Attendance.findOne({
                studentRandomId: row.StudentId,
                month: month,
                year: year,
                attdWeek: week,
            });

            // if (isExist) {
            //     // If attendance exists, skip this record
            //     console.log(`Attendance already exists for Student ID: ${row.StudentId}`);
            //     continue;
            // }
            try {
                if (row.AttendanceScore >= existingData.data[0].min && row.AttendanceScore <= existingData.data[0].max && row.AttendanceScore != '' || row.AttendanceScore != 0) {
                    attendanceRecords.push({
                        studentRandomId: row.StudentId, // First column
                        class: row.Class || '', // Class
                        AttendanceScore: row.AttendanceScore || 0, // Week 1
                        enumeratorId: userID, // From function arguments
                        month: month, // From function arguments
                        year: year, // From function arguments
                        attdWeek: week,
                    });

                }

                else {
                    console.log(`'value bigger smaller than 20  or greater than 25' for : ${row.StudentId}`);

                }
            }
            catch (err) {
                return next(err)
            }


        }

        // console.log(attendanceRecords)
        // console.log(attendance.length)
        if (attendanceRecords.length > 0 && !attendance.length) {
            // Insert all new records into MongoDB
            await Attendance.insertMany(attendanceRecords);
        } else if (attendanceRecords.length > 0 && attendance.length) {
            const updateCount = attendance.length;
            await Attendance.updateMany({ randomId: req.parsedData.StudentId, week, month, year }, { ...attendanceRecords }, { new: true, runValidators: true });
            return res.status(200).json({ message: `Attendance sheet updated  for ${updateCount} persons`, totalInserted: attendanceRecords.length });

        }
        else {
            return res.status(400).json({ message: 'No new attendance records to upload.' });
        }
        const count = attendanceRecords.length;

        res.status(200).json({ message: `Attendance sheet uploaded  for ${count} persons`, totalInserted: attendanceRecords.length });
    } catch (error) {
        return next(error);
    }
};


export const getStudentsAttendance = async (req, res, next) => {
    try {
        const { userID, permissions } = req.user;
        const { year, week, month, school } = req.query;

        // Filter conditions
        let basket = {};

        // if (!permissions.includes('handle_registrars')) {
        //     basket.enumeratorId = userID;
        // }

        if (permissions.includes('handle_students') && permissions.length === 1) {
            basket = { createdBy: userID };
        }

        else {
            basket = {};
        }

        if (year) basket.year = parseInt(year, 10);; // Ensure year is numeric
        if (week) basket.attdWeek = parseInt(week, 10);; // Ensure week is numeric
        if (month) basket.month = parseInt(month, 10);; // Ensure month is numeric
        if (school) basket.schoolId = school;



        console.log(basket);

        const attendance = await Attendance.aggregate([
            {
                $match: basket, // Match filters
            },
            {
                $lookup: {
                    from: 'students', // Collection name for Student schema
                    localField: 'studentRandomId', // Field in Attendance
                    foreignField: 'randomId', // Field in Student schema
                    as: 'studentDetails', // Output field for joined data
                },
            },
            {
                $unwind: {
                    path: '$studentDetails', // Flatten joined data
                },
            },
            {
                $lookup: {
                    from: 'allschools', // Collection name for School schema
                    localField: 'studentDetails.schoolId', // Field in Student schema
                    foreignField: '_id', // Field in School schema
                    as: 'schoolDetails', // Output field for joined data
                },
            },
            {
                $unwind: {
                    path: '$schoolDetails', // Flatten joined school data
                    preserveNullAndEmptyArrays: true, // Keep student data even if no school match
                },
            },
            {
                $project: {
                    _id: 0, // Exclude MongoDB's `_id`
                    year: 1,
                    attdWeek: 1,
                    month: 1,
                    class: 1,
                    studentRandomId: 1,
                    AttendanceScore: 1,
                    'studentDetails.surname': 1,
                    'studentDetails.firstname': 1,
                    'studentDetails.middlename': 1,
                    'studentDetails.ward': 1,
                    'studentDetails.lgaOfEnrollment': 1,
                    'studentDetails.presentClass': 1,
                    'studentDetails.state': 1,
                    'studentDetails.accountNumber': 1,
                    'studentDetails.bankName': 1,
                    'schoolDetails.schoolName': 1,
                    'schoolDetails._id': 1,
                    'studentDetails.presentClass': 1,
                },
            },
            {
                $sort: { createdAt: -1 }, // Sort by createdAt in descending order
            },
        ]);


        if (permissions.includes('handle_students') && permissions.length === 1) {

            return res.status(200).json({ attendance });
        }
        else {


            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            const totalScores = attendance.reduce((acc, record) => {
                // Check if studentId exists in the accumulator
                console.log(record)
                if (!acc[record.studentRandomId]) {
                    acc[record.studentRandomId] = {
                        studentId: record.studentRandomId,
                        totalAttendanceScore: 0, // Initialize as a number
                    };
                }

                // Add the attendance score to the student's total
                acc[record.studentRandomId].totalAttendanceScore += Number(record.AttendanceScore) || 0;

                return acc;
            }, {});

            console.log('getting attendance')
            console.log(totalScores)

            console.log(attendance)
            // const orderedHeaders = [
            //     'S/N',

            //     'studentRandomId',
            //     'schoolId',
            //     'schoolName',
            //     'totalAttendanceScore',
            //     'year', 
            //     'month', 
            //     'surname',
            //     'firstname',
            //     'middlename',
            //     'presentClass',
            //     'nationality',
            //     'stateOfOrigin',
            //     'lga',
            //     'studentNin',
            //     'lgaOfEnrollment',
            //     "ward",
            //     'communityName',
            //     'residentialAddress',
            //     'yearOfEnrollment',
            //     'parentName',
            //     'parentPhone',
            //     'parentOccupation',
            //     'parentNin',
            //     'parentBvn',
            //     'bankName',
            //     'accountNumber',
            //     'lastLogged',
            //     'createdAt',
            //     'createdBy'
            // ];

            // const mergedData = attendance.map(student => {
            //     const totalScore = totalScores[student.studentId]?.totalAttendanceScore || 0;
            //     return {
            //         ...student,
            //         totalAttendanceScore: totalScore,
            //     };
            // });

            // console.log(totalScores)
            // console.log(mergedData.length)

            // const headers = ['S/N', 'studentId', 'schoolId', 'schoolName', ...orderedHeaders.filter(header => header !== 'S/N' && header !== 'schoolName' && mergedData.some(student => student.hasOwnProperty(header)))];

            // let count = 1;

            const aggregatedData = attendance.reduce((acc, curr) => {
                const { studentRandomId, AttendanceScore, month, year, studentDetails, schoolDetails } = curr;

                const key = `${studentRandomId}-${month}-${year}`;
                if (!acc[key]) {
                    acc[key] = {
                        studentRandomId,
                        month,
                        year,
                        totalAttendanceScore: 0,
                        surname: studentDetails.surname,
                        firstname: studentDetails.firstname,
                        ward: studentDetails.ward,
                        lgaOfEnrollment: studentDetails.lgaOfEnrollment,
                        presentClass: studentDetails.presentClass,
                        bankName: studentDetails.bankName,
                        accountNumber: studentDetails.accountNumber,
                        schoolName: schoolDetails.schoolName,
                    };
                }

                acc[key].totalAttendanceScore += parseInt(AttendanceScore, 10); // Sum attendance scores
                return acc;
            }, {});
            // const formattedData = mergedData.map(student => {
            //     const row = {};
            //     headers.forEach(header => {
            //         // Populate fields like _id, schoolId, ward, createdBy with actual readable data
            //         if (header === 'S/N') {
            //             row[header] = count++; // Ensure _id is a string
            //         } else if (header === 'createdBy' && student[header]) {
            //             row[header] = student[header].fullName || ''; // Assuming 'name' is a field in the 'createdBy' collection
            //         } else if (student[header] && header === 'schoolId') {
            //             row[header] = student[header].schoolCode || ''; // Assuming 'name' is a field in the 'createdBy' collection
            //         } else if (student[header] && header === 'randomId') {
            //             // student[header] && header === 'studentId';
            //             row['studentId'] = student[header] || ''; // Assuming 'name' is a field in the 'createdBy' collection
            //         } else if (header === 'schoolName') {
            //             // student[header] && header === 'studentId';
            //             row[header] = student.schoolId?.schoolName || '';
            //         }

            //         else {
            //             row[header] = student[header] || ''; // Handle regular fields
            //         }
            //     });
            //     return row;
            // });

            // Create a workbook and worksheet
            const formattedData = Object.values(aggregatedData).map((student) => ({
                StudentID: student.studentRandomId,
                Surname: student.surname,
                Firstname: student.firstname,
                Middlename: student.middlename || '', // Include middlename, default to empty string if missing
                Month: student.month,
                Year: student.year,
                TotalAttendanceScore: student.totalAttendanceScore,
                Ward: student.ward,
                LGA: student.lgaOfEnrollment,
                Class: student.presentClass,
                BankName: student.bankName,
                AccountNumber: student.accountNumber,
                SchoolName: student.schoolName,
            }));

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
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
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
        const { accountNumber } = req.body;

        const isExistingAccountNumber = await Student.findOne({ accountNumber });
        if (isExistingAccountNumber && accountNumber !== '') return next(new BadRequestError(`Account Number ${accountNumber} already exists`))
        const student = new Student({ ...req.body, createdBy: userID, passport: secure_url, randomId: randomId, src: "Web" })
        await student.save();

        const sessionData = req.session;

        addLogToUser(Registrar, userID, `Enumerator Created student with id: ${student._id}`, req.ip, {
            sessionId: sessionData.id || 'unknown',
            sessionCreated: sessionData.cookie._expires,
            data: sessionData, // Add any relevant session details
        });

        res.status(StatusCodes.OK).json({ student })
    } catch (error) {
        return next(error)
    }
}


export const deleteStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const student = await Student.findOne({ randomId: id });

        if (!student) return next(new NotFoundError('There is no student with id: ' + id));

        const deletedStudent = await Student.findOneAndDelete({ randomId: id });

        if (!deletedStudent) return next(new Error('An Error occurred while trying to delete student'));

        // Fetch the current list of all students again after deletion
        const remainingStudents = await Student.find({});

        res.status(StatusCodes.OK).json({ remainingStudents });
    } catch (error) {
        return next(error);
    }
};


export const updateStudent = async (req, res, next) => {
    console.log("Entering updateStudent...");
    console.log("Uploaded Image:", req.uploadedImage);
    console.log("File:", req.file);

    const { id } = req.params;

    try {
        console.log("Fetching student by ID...");
        const student = await Student.findById({ _id: id });
        if (!student) {
            console.log("Student not found");
            // return next(new NotFoundError('There is no student with id: ' + id)); // Ensure early return
        }

        const registrationTime = new Date(student.createdAt);
        const currentTime = new Date();
        const timeDifference = (currentTime - registrationTime) / (1000 * 60 * 60); // Calculate time difference in hours
        console.log("Time Difference (hours):", timeDifference);

        if (timeDifference >= 5) {
            console.log("Time difference exceeded, rejecting update...");
            return next(
                new BadRequestError('Students can only be updated within the first 5 hours of registration')
            ); // Ensure early return
        }

        console.log("Within update time window...");
        let updatedStudent;
        if (req.file && req.uploadedImage) {
            console.log("Processing file update...");
            const { secure_url } = req.uploadedImage;

            updatedStudent = await Student.findByIdAndUpdate(
                { _id: id },
                { ...req.body, passport: secure_url },
                { new: true, runValidators: true }
            );
        } else {
            console.log("No file uploaded. Updating other fields...");
            updatedStudent = await Student.findByIdAndUpdate(
                { _id: id },
                { ...req.body },
                { new: true, runValidators: true }
            );
        }

        console.log("Updated student:", updatedStudent);
        return res.status(StatusCodes.OK).json({ updatedStudent }); // Ensure response is sent only once
    } catch (error) {
        console.error("Error occurred:", error);
        return next(error); // Pass errors to the error handler
    }
};


