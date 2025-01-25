
import { NotAuthenticatedError, NotFoundError } from '../errors/index.js';
import { Admin } from '../models/adminSchema.js';
import { Registrar } from '../models/registrarSchema.js';
import { verifyJWT } from '../utils/index.js';
import { StatusCodes } from 'http-status-codes';
import { PayrollSpecialist } from '../models/payRollSpecialistSchema.js';


export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    let token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        token = req.query.token; // Extract token from query string
    }
    if (!token) return next(new NotAuthenticatedError("Invalid Token Not authorized to access this route"));
    try {
        const decoded = verifyJWT({ token });
        const { userID } = decoded;

        const admin = await Admin.findById(userID).populate({
            path: 'roles', // Populate roles
            populate: {
                path: 'permissions', // Populate permissions within each role
                select: 'name', // Select only the "name" field of permissions
            },
        });
        const registrar = await Registrar.findById(userID).populate({
            path: 'roles', // Populate roles
            populate: {
                path: 'permissions', // Populate permissions within each role
                select: 'name', // Select only the "name" field of permissions
            },
        });;
        const payrollSpecialist = await PayrollSpecialist.findById(userID).populate({
            path: 'roles', // Populate roles
            populate: {
                path: 'permissions', // Populate permissions within each role
                select: 'name', // Select only the "name" field of permissions
            },
        });;

        if (!admin && !registrar && !payrollSpecialist) next(new NotFoundError("User not found"));
        if (admin) {

            const permissionsArray = admin.roles.flatMap(role => role.permissions.map(permission => permission.name));
            admin.permissions = permissionsArray;
            const { fullName, lastname, email, permissions, userID: _id } = admin;
            req.user = { fullName, email, permissions, userID };
        }
        if (registrar) {
            const permissionsArray = registrar.roles.flatMap(role => role.permissions.map(permission => permission.name));
            registrar.permissions = permissionsArray
            const { fullName, email, permissions, userID: _id } = registrar;
            req.user = { fullName, email, permissions, userID };
        }
        if (payrollSpecialist) {
            const permissionsArray = payrollSpecialist.roles.flatMap(role => role.permissions.map(permission => permission.name));
            payrollSpecialist.permissions = permissionsArray
            const { fullName, email, permissions, userID: _id } = payrollSpecialist;
            req.user = { fullName, email, permissions, userID };
        }

        next();
    }
    catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return next(new NotAuthenticatedError("Access Denied: Invalid token"));
        }
        return next(new NotAuthenticatedError(`Access Denied: ${err}`))
    }

}



export const authorizePermission = (requiredPermissions) => {
    return (req, res, next) => {
        const user = req.user;
        

        if (!user || !user.permissions || user.permissions.length === 0) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'User does not have any permissions' });
        }

        // Ensure requiredPermissions is an array
        if (!Array.isArray(requiredPermissions)) {
            requiredPermissions = [requiredPermissions];
        }
 
        // Check if user has at least one required permission
        const hasPermission = requiredPermissions.some((permission) =>
            user.permissions.includes(permission)
        );

        if (!hasPermission) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'User does not have the required permissions' });
        }

        // User has at least one required permission, proceed
        next();
    };
};



