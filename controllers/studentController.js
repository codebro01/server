import { Student, Permissions, Registrar } from '../models/index.js'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError, NotFoundError, NotAuthenticatedError } from "../errors/index.js";
import { addLogToUser } from "../utils/index.js";





export const getAllStudents = async (req, res, next) => {
    try {
        const { userID } = req.user;
        // if(!userID) return next(new NotAuthenticatedError('Not authorized to get students'));

        const { ward, schoolId, lga, presentClass, sortBy } = req.query;

        // Create a basket object
        let basket = { createdBy: userID };
        if (presentClass) basket.presentClass = presentClass;
        if (ward) basket.ward = ward;
        if (schoolId) basket.schoolId = schoolId;
        if (lga) basket.lga = lga;

        let sort = { createdAt: -1 }; // Default to descending order for createdAt
        if (sortBy) {
            const [field, order] = sortBy.split(',');
            sort[field] = order === 'desc' ? -1 : 1; // Sort in ascending (1) or descending (-1)
        }



        const students = await Student.find(basket).populate('schoolId').populate('ward').sort(sort).collation({ locale: "en", strength: 2 });
        const permissions = await Permissions.find({});
        res.status(StatusCodes.OK).json({ students, totalStudents: students.length });
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