import { Registrar } from "../models/registrarSchema.js";
import { createTokenUser } from "../utils/createTokenUser.js";
import { attachCookieToResponse, generateRandomId, addLogToUser } from "../utils/index.js";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../errors/badRequestError.js";
import { NotFoundError } from "../errors/notFoundError.js";
import { Roles } from "../models/rolesSchema.js";
import { NotAuthenticatedError } from "../errors/notAuthenticatedError.js";


export const getAllRegistrars = async (req, res, next) => {

    try {
        const registrars = await Registrar.find({}).select('-password -logs -lastLogged -permissions -roles -accountNumber -bankName').sort('fullName').collation({ locale: "en", strength: 2 });
        res.status(200).json({ registrars, total: registrars.length });
    }
    catch (err) {
        return next(err)
    }
}

export const getSingleRegistrar = async (req, res, next) => {

        try {
            const { id } = req.params;
            const registrar = await Registrar.findById({ _id: id }).select('-password -roles -permissions -logs');
            if (!registrar) return next(new NotFoundError(`There is no user with id: ${id}`));
            res.status(200).json(registrar)
        }
        catch(err) {
            return next(err)
        }
}


export const createRegistrar = async (req, res, next) => {

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
        return next(err)
    }
}

export const loginRegistrar = async (req, res, next) => {
    try {
        let { email, password } = req.body;


        if (!email || !password) return next(new BadRequestError("Email and password is required"))
        const user = await Registrar.findOne({ email });
        if (!user) return next(new NotFoundError('User not found'));
        if(user.isActive === false) return next(new NotAuthenticatedError('User has been disabled'));
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
        res.status(StatusCodes.OK).json({ tokenUser, token, allPermissionNames });
    }
    catch (err) {
        return next(err)
    }
}


export const loginWithUrl = async (req, res, next) => {
    const {email, randomId} = req.query;

    if(!email || !randomId) return next(new BadRequestError('email and randomId is required'));
    const user = await Registrar.findOne({ email });

    if (!user) return next(new NotFoundError('User not found'));
    const isMatch = user.randomId == randomId;
    if (!isMatch) return next(new NotFoundError('invalid user'));
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
    res.status(StatusCodes.OK).json({ tokenUser, token, allPermissionNames });

}





export const updateRegistrar = async (req, res, next) => {
   try {
    let secure_url;
       if (req.file) {
           const uploadedImage = req.uploadedImage;
           secure_url = uploadedImage;
       }
       const { id } = req.params;

       const { permissions } = req.user;
       const registrar = await Registrar.findById({ _id: id })

       if (!registrar) return next(new NotFoundError('There is no registrar with id: ' + id));



       const updatedRegistrar = await Registrar.findOneAndUpdate({ _id: id }, { ...req.body }, { new: true, runValidators: true });
       if (!updatedRegistrar) return next(new Error('An Error occured while trying to update registra'))
       res.status(StatusCodes.OK).json({ updatedRegistrar: updatedRegistrar });
   }
   catch(err) {
    return next(err)
   }
}

export const changeRegistrarPassword = async (req, res, next) => {
    try {
        const { userID } = req.user;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return next(new BadRequestError("current and new password is required to update you password"))
        const user = await Registrar.findById({ _id: userID });
        if (!user) return next(new NotFoundError(`No user not found`));
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

        addLogToUser(Registrar, user._id, 'Enumerator changed password', req.ip, {
            sessionId: sessionData.id || 'unknown',
            sessionCreated: sessionData.cookie._expires,
            data: sessionData, // Add any relevant session details
        });
        res.status(StatusCodes.OK).json({ message: "Password has been successfully changed" });
    }
    catch (err) {
        console.log(err)
        return next(err)
    }


}
export const resetRegistrarPassword = async (req, res, next) => {
    try {
        const { id } = req.query;
        if (!id) return next(new BadRequestError("User not found, or invalid id"))
        const user = await Registrar.findById({ _id: id });
        if (!user) return next(new NotFoundError(`No user found`));
        user.password = "123456";
        await user.save();
        res.status(StatusCodes.OK).json({ message: `Password reset successful` });
    }
    catch (err) {
        return next(err)
    }


}

export const toggleRegistrarStatus = async (req, res, next) => {
    try {
        const { id } = req.query;

        const user = await Registrar.findById(id);
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

export const deleteRegistrar = async (req, res, next) => {
    try {
        const {id} = req.params;
        
        const user = await Registrar.findById({ _id: id });
        if (!user) return next(new NotFoundError(`user not found`));
        
        await Registrar.findByIdAndDelete({_id:id});
        res.status(StatusCodes.OK).json({ message: `Useer hase been successfully deleted` });
    }
    catch (err) {
        return next(err)
    }
}


