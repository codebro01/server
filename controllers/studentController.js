import { Student, Permissions, Registrar } from '../models/index.js'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError, NotFoundError, NotAuthenticatedError } from "../errors/index.js";
import { addLogToUser } from "../utils/index.js";
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname } from 'path';



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



export const getAllStudents = async (req, res, next) => {
    console.log(req.url)
    try {
        await Student.syncIndexes();

        const { userID, permissions } = req.user;
        // if(!userID) return next(new NotAuthenticatedError('Not authorized to get students'));

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

        if (req.path === '/student') {
            res.status(StatusCodes.OK).json({ students, totalStudents: students.length });
        }

        else if (req.path === '/student/download') {
            if (!students.length) {
                return next(new NotFoundError("No students with the filtered data provided"))
            };

            const allKeys = new Set();
            students.forEach(student => {
                Object.keys(student).forEach(key => allKeys.add(key));
            });

            const headers = Array.from(allKeys);

            const formattedData = students.map(student => {
                const row = {};
                headers.forEach(header => {
                    row[header] = student[header] || '';
                });
                return row;
            })

            // Create a workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(formattedData);

            // Append the worksheet to the workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

            // Write the workbook to a file
            const filePath = path.join(__dirname, 'students.xlsx');
            XLSX.writeFile(workbook, filePath);

            res.download(filePath, 'students.xlsx', err => {
                if (err) throw err;

                // Clean up after download
                fs.unlinkSync(filePath);
            });
        }





    }
    catch (err) {
        console.log(err)
    }
}



export const createStudent = async (req, res) => {
    const uploadedImage = req.uploadedImage;
    if (!uploadedImage) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "No uploaded image found" });
    }
    const { secure_url } = uploadedImage;
    const { userID } = req.user;
    // const optional = req.body.ward || "others"
    const student = new Student({ ...req.body, createdBy: userID, passport: secure_url })
    await student.save();

    const sessionData = req.session;

    addLogToUser(Registrar, userID, `Enumerator Created student with id: ${student._id}`, req.ip, {
        sessionId: sessionData.id || 'unknown',
        sessionCreated: sessionData.cookie._expires,
        data: sessionData, // Add any relevant session details
    });

    res.status(StatusCodes.OK).json({ student })
}
export const deleteStudent = async (req, res, next) => {
    const { id } = req.params;
    const student = await Student.findById({ _id: id });
    if (!student) return next(new NotFoundError('There is no student with id: ' + id));
    const deletedStudent = await Student.findByIdAndDelete({ _id: id });
    if (!deletedStudent) return next(new Error('An Error while trying to delete student'))
    res.status(StatusCodes.OK).json({ deletedStudent: deletedStudent });
}


export const updateStudent = async (req, res) => {
    if (req.file) {
        const uploadedImage = req.uploadedImage;
        const { secure_url } = uploadedImage;
    }

    const { permissions } = req.user;

    console.log(permissions);

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
}