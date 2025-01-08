import { PayrollSpecialist } from "../models/payRollSpecialistSchema.js";
import { createTokenUser } from "../utils/createTokenUser.js";
import { attachCookieToResponse, generateRandomId, addLogToUser } from "../utils/index.js";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../errors/badRequestError.js";
import { NotFoundError } from "../errors/notFoundError.js";
import { Roles } from "../models/rolesSchema.js";


export const getAllPayrollSpecialists = async (req, res, next) => {

    try {
        const payrollSpecialists = await PayrollSpecialist.find({}).select('-password -logs -lastLogged -permissions -roles -accountNumber -bankName').sort('fullName').collation({ locale: "en", strength: 2 });
        res.status(200).json({ payrollSpecialists, total: payrollSpecialists.length });
    }
    catch (err) {
        return next(err)
    }
}

export const getSinglePayrollSpecialist = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payrollSpecialist = await PayrollSpecialist.findById({ _id: id });
        res.status(200).json(payrollSpecialist);
    } catch (error) {
        return next(err)
    }
}


export const createPayrollSpecialist = async (req, res, next) => {

    try {

        const payrollSpecialistRole = await Roles.findOne({ role: 'payrollSpecialist' });
        const lastLogged = new Date(Date.now());
        // await Registrar.deleteMany({});
        const uploadedImage = req.uploadedImage;
        if (!uploadedImage) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "No uploaded image found" });
        }
        const { secure_url, public_id } = uploadedImage;

        const isExistingEmail = await PayrollSpecialist.findOne({ email: req.body.email });
        const isExistingAccountNumber = await PayrollSpecialist.findOne({ accountNumber: req.body.accountNumber });
        const isExistingPhone = await PayrollSpecialist.findOne({ phone: req.body.phone });
        if (isExistingEmail) return next(new BadRequestError('User already exist with email: ' + req.body.email))
        if (isExistingAccountNumber) return next(new BadRequestError('User already exist with Account Number: ' + req.body.accountNumber))
        if (isExistingPhone) return next(new BadRequestError('User already exist with phone Number: ' + req.body.phone));
        const generatedRandomId = generateRandomId();

        const payrollSpecialist = await PayrollSpecialist.create({ ...req.body, roles: [payrollSpecialistRole._id], permissions: [payrollSpecialistRole.permissions], lastLogged, passport: secure_url, randomId: generatedRandomId });

        if (!payrollSpecialist) return next(new BadRequestError('An error occured creating Enumerator'));
        res.status(200).json({ Message: "Payrole Specialist Registered" });


    }
    catch (err) {
        return next(err)
    }
}

export const loginPayrollSpecialist = async (req, res, next) => {
    try {
        const { email, password } = req.body;


        if (!email || !password) return next(new BadRequestError("Email and password is required"))
        const user = await PayrollSpecialist.findOne({ email });
        if (!user) return next(new NotFoundError('User not found'));
        const isMatch = await user.comparePWD(password);
        if (!isMatch) return next(new NotFoundError('invalid credentials'));
        await user.populate({
            path: 'roles', // Populate roles
            populate: {
                path: 'permissions', // Populate permissions within each role
                select: 'name', // Select only the "name" field of permissions
            },
        });;
        const tokenUser = createTokenUser(user);
        const allPermissionNames = tokenUser.roles.flatMap(role =>
            role.permissions.map(permission => permission.name)
        );

        const token = attachCookieToResponse({ user: tokenUser });
        const sessionData = req.session;

        addLogToUser(PayrollSpecialist, user._id, 'Payroll Specialist logged in', req.ip, {
            sessionId: sessionData.id || 'unknown',
            sessionCreated: sessionData.cookie._expires,
            data: sessionData, // Add any relevant session details
        });
        res.status(StatusCodes.OK).json({ tokenUser, token, allPermissionNames });
    }
    catch (err) {
        console.log(err)
    }
}

export const updatePayrollSpecialist = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payrollSpecialist = await PayrollSpecialist.findById({ _id: id })
        if (!payrollSpecialist) return next(new NotFoundError('There is no Payroll Specialist with id: ' + id));
        let secure_url = payrollSpecialist.passport; // Default to previous passport
        if (req.file) {
            const { uploadedImage } = req; // Assuming `req.uploadedImage` contains the uploaded image details
            if (!uploadedImage || !uploadedImage.secure_url) {
                return next(new Error("Image upload failed. Please try again."));
            }
            secure_url = uploadedImage.secure_url;
        }
        const { permissions } = req.user;
        Object.assign(payrollSpecialist, req.body); // Merge req.body into the document
        payrollSpecialist.passport = secure_url; // Update the passport field

        // Save the document (triggers pre-save middleware)
        const updatedPayrollSpecialist = await payrollSpecialist.save();
        if (!updatedPayrollSpecialist) return next(new Error('An Error occured while trying to update the payroll specialist'))
        res.status(StatusCodes.OK).json({ updatedPayrollSpecialist });
    } catch (error) {
        return next(error)
    }
}


export const changePayrollSpecialistPassword = async (req, res, next) => {
    try {
        const { userID } = req.user;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return next(new BadRequestError("current and new password is required to update you password"))
        const user = await PayrollSpecialist.findById({ _id: userID });
        if (!user) return next(new NotFoundError(`User does not exist`));
        const hashedPassword = await user.comparePWD(currentPassword)
        if (!hashedPassword) return next(new BadRequestError('Wrong password'));
        if (currentPassword === newPassword) return next(new BadRequestError('Please change the password, you are setting the same old password'));
        user.password = newPassword;
        await user.validate(["password"])
        await user.save();

        const tokenUser = createTokenUser(user);
        const token = attachCookieToResponse({ user: tokenUser });
        const sessionData = req.session
            ;

        addLogToUser(PayrollSpecialist, user._id, 'Payroll Specialist changed password', req.ip, {
            sessionId: sessionData.id || 'unknown',
            sessionCreated: sessionData.cookie._expires,
            data: sessionData, // Add any relevant session details
        });
        res.status(StatusCodes.OK).json({ message: "Password has been successfully changed" });
    }
    catch (err) {
        console.log(err)
        // return next(new Error("An error occured trying to change password, please try again"))
    }


}


export const resetPayrollSpecialistPassword = async (req, res, next) => {
    try {
        const { id } = req.query;
        if (!id) return next(new BadRequestError("Please user id is required to reset password"))
        const user = await PayrollSpecialist.findById({ _id: id });
        if (!user) return next(new NotFoundError(`user not found`));
        user.password = "123456";
        await user.save();
        res.status(StatusCodes.OK).json({ message: `Password reset successful` });
    }
    catch (err) {
        return next(err)
    }


}
export const deletePayrollSpecialist = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await PayrollSpecialist.findById({ _id: id });
        if (!user) return next(new NotFoundError(`user not found`));

        await PayrollSpecialist.findByIdAndDelete({ _id: id });
        res.status(StatusCodes.OK).json({ message: `Useer hase been successfully deleted` });
    }
    catch (err) {
        return next(err)
    }
}
export const togglePayrollSpecialistStatus = async (req, res, next) => {
    try {
        const { id } = req.query;

        // Check if the user exists
        const user = await PayrollSpecialist.findById(id);
        if (!user) return next(new NotFoundError('User not found'));

        // Toggle the user's status
        user.isActive = !user.isActive; // Assuming `isActive` is a boolean field in your schema

        // Save the updated user
        const updatedUser = await user.save();

        // Return a response
        res.status(StatusCodes.OK).json({
            message: `User has been successfully ${user.isActive ? 'enabled' : 'disabled'}`,
            user: updatedUser,
        });
    } catch (err) {
        return next(err);
    }
};
