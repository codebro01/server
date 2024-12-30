
import { AdminSchema } from "../models/index.js";


export const checkPermissions = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            // Get the user and populate the role with its permissions
            const user = await AdminSchema.findById(req.user.userID).populate({
                path: 'role',
                populate: { path: 'permissions' }
            });

            // If no user found, return an error
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Get the permissions for the user's role
            const userPermissions = user.role.permissions.map(p => p.name);

            // Check if the user has the required permissions
            const hasPermission = requiredPermissions.every(permission =>
                userPermissions.includes(permission)
            );

            if (!hasPermission) {
                return res.status(403).json({ message: 'Access denied' });
            }

            // If the user has required permissions, proceed to the route
            next();
        } catch (error) {
            return res.status(500).json({ message: 'Server error' });
        }
    };
};
