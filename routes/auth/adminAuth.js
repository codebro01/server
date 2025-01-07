import express from 'express';
import { createAdmin, loginAdmin, getAllAdmins, updateAdmin } from '../../controllers/index.js';
import { upload } from "../../config/multer.js";
import { cloudinaryImageUploader } from '../../utils/cloudinaryImageUploader.js';

import {authorizePermission, authMiddleware} from '../../middlewares/authenticationMiddleware.js'

const router = express.Router();

router.post('/register', upload.single('image'), (req, res, next) => cloudinaryImageUploader(req, res, next, 'admin_passport'), createAdmin)
router.route('/login')
    .post(loginAdmin);
router.get('/', authMiddleware, authorizePermission('handle_admins'), getAllAdmins)
export default router;
router.patch('/update/:id', authMiddleware, authorizePermission('handle_admins'), updateAdmin)