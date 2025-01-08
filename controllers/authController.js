import { BadRequestError, NotFoundError } from "../errors/index.js";
import { Admin, Roles, Permissions, Registrar } from "../models/index.js";
import { StatusCodes } from 'http-status-codes';
import { attachCookieToResponse, createTokenUser, generateRandomId, addLogToUser } from "../utils/index.js";

import mongoose from "mongoose";// create admins

export const getAllAdmins = async (req, res, next) => {
    try {

        const admins = await Admin.find({}).sort('-createdAt').select('-password');
        return res.status(StatusCodes.OK).json({ admins, totalAdmins: admins.length });
    }
    catch (err) {
        console.log(err)
    }
}

export const getSingleAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;
        const admin = await Admin.findById({ _id: id });
        res.status(200).json({ admin })
    } catch (error) {
        return next(err)
    }
}

export const createAdmin = async (req, res, next) => {

    const uploadedImage = req.uploadedImage;
    if (!uploadedImage) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "No uploaded image found" });
    }
    const { secure_url, public_id } = uploadedImage;

    try {
        const count = (await Admin.countDocuments() < 1 ? true : false);
        if (count) {

            const superAdminRole = await Roles.findOne({ role: 'super_admin' });
            console.log(superAdminRole)
            const generatedRandomId = generateRandomId();
            const superAdmin = await Admin.create({ ...req.body, roles: [superAdminRole._id], randomId: generatedRandomId, passport: secure_url });
            if (!superAdmin) return next(new BadRequestError('An error occured creating admin'))
            const tokenUser = createTokenUser(superAdmin);

            attachCookieToResponse({ user: tokenUser });
            // req.session.user = tokenUser;
            res.status(200).json({ superAdmin, tokenUser });
            return;
        };

        const adminRole = await Roles.findOne({ role: 'admin' });
        const permissions = await Roles.find({});
        const userExist = await Admin.findOne({ email: req.body.email });
        if (userExist) return next(new BadRequestError('Email already exist, please sign in'))
        const generatedRandomId = generateRandomId();
        const admin = await Admin.create({ ...req.body, roles: [adminRole._id], passport: secure_url, randomId: generatedRandomId, passport: secure_url })
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

    const token = attachCookieToResponse({ user: tokenUser });
    // req.session.user = tokenUser;
    res.status(StatusCodes.OK).json({ tokenUser, token, allPermissionNames });
}

export const updateAdmin = async (req, res, next) => {
    try {

        const { id } = req.params;

        const admin = await Admin.findById({ _id: id })

        if (!admin) return next(new NotFoundError('There is no registrar with id: ' + id));

        console.log(req.body)

        const updatedAdmin = await Admin.findByIdAndUpdate({ _id: id }, { ...req.body }, { new: true, runValidators: true });
        // if (!updatedAdmin) return next(new Error('An Error occured while trying t    o update registrar'))
        res.status(StatusCodes.OK).json({ updatedAdmin: updatedAdmin });
    }
    catch (err) {
        return next(err)
    }
}

export const resetAdminPassword = async (req, res, next) => {
    try {
        const { id } = req.query;
        if (!id) return next(new BadRequestError("Invalid id"))
        const user = await Admin.findById({ _id: id });
        if (!user) return next(new NotFoundError(`No user found`));
        user.password = "123456";
        await user.save();
        res.status(StatusCodes.OK).json({ message: `Password reset successful` });
    }
    catch (err) {
        return next(err)
    }


}

export const toggleAdminStatus = async (req, res, next) => {
    try {
        const { id } = req.query;

        const user = await Admin.findById(id);
        if (!user) return next(new NotFoundError('User not found'));

        user.isActive = !user.isActive;

        const updatedUser = await user.save();

        res.status(StatusCodes.OK).json({
            message: `User has been successfully ${user.isActive ? 'enabled' : 'disabled'}`,
            user: updatedUser,
        });
    } catch (err) {
        return next(err);
    }
};




