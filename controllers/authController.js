import { BadRequestError, NotFoundError } from "../errors/index.js";
import { Admin, Roles, Permissions, Registrar } from "../models/index.js";
import { StatusCodes } from 'http-status-codes';
import { attachCookieToResponse, createTokenUser, generateRandomId, addLogToUser } from "../utils/index.js";

import mongoose from "mongoose";// create admins
export const createAdmin = async (req, res, next) => {

    // const {username, password} = req.body;
    // await Admin.deleteMany({});
    try {
        const count = (await Admin.countDocuments() < 1 ? true : false);

        if (count) {

            const superAdminRole = await Roles.findOne({ role: 'super_admin' });
            const superAdmin = await Admin.create({ ...req.body, roles: [superAdminRole._id] });
            if (!superAdmin) return next(new BadRequestError('An error occured creating admin'))
            const tokenUser = createTokenUser(superAdmin);
            attachCookieToResponse(res, { user: tokenUser });
            // req.session.user = tokenUser;
            res.status(200).json({ superAdmin, tokenUser });
            return;
        };

        const adminRole = await Roles.findOne({ role: 'admin' });
        const permissions = await Roles.find({});
        const userExist = await Admin.findOne({ email: req.body.email });
        if (userExist) return next(new BadRequestError('Email already exist, please sign in'))
        const uploadedImage = req.uploadedImage;
        if (!uploadedImage) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "No uploaded image found" });
        }
        const { secure_url, public_id } = uploadedImage;
        const generatedRandomId = generateRandomId();
        const admin = await Admin.create({ ...req.body, roles: [adminRole._id], passport: secure_url, randomId: generatedRandomId })
        const tokenUser = createTokenUser(admin);
        // attachCookieToResponse(res, { user: tokenUser })
        // req.session.user = tokenUser;

        res.status(200).json({ tokenUser });
    }
    catch (err) {
        console.log(err)
        return res.status(500).json(err)
    }
}

// login admins 

export const loginAdmin = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) return next(new BadRequestError("Email and password is required"))
    const user = await Admin.findOne({ email });

    if (!user) return next(new NotFoundError('invalid credentials'));
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

    console.log(allPermissionNames);
    const token = attachCookieToResponse({ user: tokenUser });
    // req.session.user = tokenUser;
    res.status(StatusCodes.OK).json({ tokenUser, token, allPermissionNames });
}

export const createRegistrar = async (req, res, next) => {

    // const {username, password} = req.body;
    // await Admin.deleteMany({});
    try {

        const registrarRole = await Roles.findOne({ role: 'registrar' });
        const lastLogged = new Date(Date.now());
        // await Registrar.deleteMany({});
        const uploadedImage = req.uploadedImage;
        if (!uploadedImage) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "No uploaded image found" });
        }
        const { secure_url, public_id } = uploadedImage;

        const isExistingEmail = await Registrar.findOne({ email: req.body.email });
        const isExistingAccountNumber = await Registrar.findOne({ accountNumber: req.body.accountNumber });
        const isExistingPhone = await Registrar.findOne({ phone: req.body.phone });
        if (isExistingEmail) return next(new BadRequestError('User already exist with email: ' + req.body.email))
        if (isExistingAccountNumber) return next(new BadRequestError('User already exist with Account Number: ' + req.body.accountNumber))
        if (isExistingPhone) return next(new BadRequestError('User already exist with phone Number: ' + req.body.phone));
        const generatedRandomId = generateRandomId();

        const registrar = await Registrar.create({ ...req.body, roles: [registrarRole._id], permissions: [registrarRole.permissions], lastLogged, passport: secure_url, randomId: generatedRandomId });

        if (!registrar) return next(new BadRequestError('An error occured creating Enumerator'));
        res.status(200).json({ registrar, registrarRole });


    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ message: "an error occured" });
    }
}


export const loginRegistrar = async (req, res, next) => {
    try {
        const { email, password } = req.body;


        if (!email || !password) return next(new BadRequestError("Email and password is required"))
        const user = await Registrar.findOne({ email });
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

        addLogToUser(Registrar, user._id, 'Enumerator logged in', req.ip, {
            sessionId: sessionData.id || 'unknown',
            sessionCreated: sessionData.cookie._expires,
            data: sessionData, // Add any relevant session details
        });
        console.log(tokenUser)
        res.status(StatusCodes.OK).json({ tokenUser, token, allPermissionNames });
    }
    catch (err) {
        console.log(err)
    }
}

export const updateRegistrar = async (req, res) => {
    if (req.file) {
        const uploadedImage = req.uploadedImage;
        const { secure_url } = uploadedImage;
    }

    const { permissions } = req.user;

    console.log(permissions);

    const { id } = req.params;
    if (!registrar) return next(new NotFoundError('There is no registrar with id: ' + id));



    const updatedRegistrar = await Registrar.findByIdAndUpdate({ _id: id }, { ...req.body, passport: secure_url }, { new: true, runValidators: true });
    if (!updatedRegistrar) return next(new Error('An Error occured while trying to update registra'))
    res.status(StatusCodes.OK).json({ updatedRegistrar: updatedRegistrar });
}

export const getAllRegistrars = async (req, res) => {
    try {
        // const { userID } = req.user;
        // if(!userID) return next(new NotAuthenticatedError('Not authorized to get students'));

        // const { fullName, lga } = req.query;

        // Create a basket object
        // let basket = { createdBy: userID };
        // if (presentClass) basket.presentClass = presentClass;
        // if (ward) basket.ward = ward;
        // if (schoolId) basket.schoolId = schoolId;
        // if (lga) basket.lga = lga;

        // let sort = { createdAt: -1 }; // Default to descending order for createdAt
        // if (sortBy) {
        //     const [field, order] = sortBy.split(',');
        //     sort[field] = order === 'desc' ? -1 : 1; // Sort in ascending (1) or descending (-1)
        // }



        const registrars = await Registrar.find({});
        res.status(StatusCodes.OK).json({ registrars, total: registrars.length });
    }
    catch (err) {
        console.log(err)
    }
}

export const changeRegistrarPassword = async (req, res, next) => {
    try {
        const { userID } = req.user;
        const { currentPassword, newPassword } = req.body;
        console.log(req.body)
        if (!currentPassword || !newPassword) return next(new BadRequestError("current and new password is required to update you password"))
        const user = await Registrar.findById({ _id: userID });
        if (!user) return next(new NotFoundError(`No user not found`));
        console.log(user)
        const hashedPassword = await user.comparePWD(currentPassword)
        console.log(hashedPassword)
        if (!hashedPassword) return next(new BadRequestError('Wrong password'));
        if (currentPassword === newPassword) return next(new BadRequestError('Please change the password, you are setting the same old password'));
        user.password = newPassword;
        await user.validate(["password"])
        await user.save();

        const tokenUser = createTokenUser(user);
        const token = attachCookieToResponse({ user: tokenUser });
        const sessionData = req.session
            ;

        addLogToUser(Registrar, user._id, 'Enumerator changed password', req.ip, {
            sessionId: sessionData.id || 'unknown',
            sessionCreated: sessionData.cookie._expires,
            data: sessionData, // Add any relevant session details
        });
        console.log(tokenUser)
        res.status(StatusCodes.OK).json({ message: "Password has been successfully changed" });
    }
    catch (err) {
        console.log(err)
        // return next(new Error("An error occured trying to change password, please try again"))
    }


}




export const resetRegistrarPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return next(new BadRequestError("Please insert email to reset password"))
        const user = await Registrar.findOne({ email });
        if (!user) return next(new NotFoundError(`No user not found`));
        console.log(user)
        user.password = "123456";
        await user.save();
        res.status(StatusCodes.OK).json({ message: `Password reset successful` });
    }
    catch (err) {
        console.log(err)
        // return next(new Error("An error occured trying to change password, please try again"))
    }


}





