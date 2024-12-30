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
            if(!superAdmin) return next(new BadRequestError('An error occured creating admin'))
            const tokenUser = createTokenUser(superAdmin);
            attachCookieToResponse(res, {user: tokenUser});
            // req.session.user = tokenUser;
            res.status(200).json({ superAdmin , tokenUser});
            return;
        };

        const adminRole = await Roles.findOne({ role: 'admin' });
        const permissions = await Roles.find({});
        const userExist = await Admin.findOne({email: req.body.email});
        if(userExist) return next(new BadRequestError('Email already exist, please sign in'))
        const uploadedImage = req.uploadedImage;
        if (!uploadedImage) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "No uploaded image found" });
        }
        const { secure_url, public_id } = uploadedImage;
        const generatedRandomId = generateRandomId();
        const admin = await Admin.create({ ...req.body, roles: [adminRole._id], passport: secure_url, randomId: generatedRandomId})
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
    const {email, password} = req.body;
    if(!email || !password) return next(new BadRequestError("Email and password is required"))
    const user = await Admin.findOne({email});

    if(!user) return next(new NotFoundError('invalid credentials'));
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
    const token = attachCookieToResponse({ user: tokenUser});
    // req.session.user = tokenUser;
    res.status(StatusCodes.OK).json({tokenUser, token, allPermissionNames });
}

export const createRegistrar = async (req, res, next) => {

    // const {username, password} = req.body;
    // await Admin.deleteMany({});
    try {
        // const collection = mongoose.connection.collection('registrars');
        // const indexes = await collection.indexes();
        // await collection.dropIndex(['lastname_1', 'firstname_1'])
            
        const registrarRole = await Roles.findOne({ role: 'registrar' });
        const lastLogged = new Date(Date.now());
        // await Registrar.deleteMany({});
        const uploadedImage = req.uploadedImage;
        if (!uploadedImage) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: "No uploaded image found" });
        }
        const { secure_url, public_id } = uploadedImage;
        
        const isExistingEmail = await Registrar.findOne({email: req.body.email});
        const isExistingAccountNumber = await Registrar.findOne({accountNumber: req.body.accountNumber});
        const isExistingPhone = await Registrar.findOne({phone: req.body.phone});
        if(isExistingEmail) return next(new BadRequestError('User already exist with email: ' + req.body.email))
        if (isExistingAccountNumber) return next(new BadRequestError('User already exist with Account Number: ' + req.body.accountNumber))
        if (isExistingPhone) return next(new BadRequestError('User already exist with phone Number: ' + req.body.phone));
        const generatedRandomId = generateRandomId();

        const registrar = await Registrar.create({ ...req.body, roles: [registrarRole._id], permissions: [registrarRole.permissions], lastLogged, passport: secure_url, randomId: generatedRandomId });
        
        if (!registrar) return next(new BadRequestError('An error occured creating Enumerator'));
            res.status(200).json({ registrar, registrarRole});
    

    }
    catch (err) {
        console.log(err)
        return res.status(500).json({message: "an error occured"});
    }
}


export const loginRegistrar = async (req, res, next) => {
try{    const { email, password } = req.body;
    if (!email || !password) return next(new BadRequestError("Email and password is required"))
    const user = await Registrar.findOne({ email });
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


    const token = attachCookieToResponse({ user: tokenUser });
    const sessionData = req.session;

addLogToUser(Registrar, user._id, 'Enumerator logged in', req.ip,  {
        sessionId: sessionData.id || 'unknown',
        sessionCreated: sessionData.cookie._expires,
        data: sessionData, // Add any relevant session details
      });

    res.status(StatusCodes.OK).json({ tokenUser, token, allPermissionNames });}
catch(err) {
    console.log(err)
}
}





