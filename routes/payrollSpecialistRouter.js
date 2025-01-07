import express from 'express';
import { getAllPayrollSpecialists, createPayrollSpecialist, loginPayrollSpecialist, updatePayrollSpecialist, changePayrollSpecialistPassword, resetPayrollSpecialistPassword } from '../controllers/index.js';
import { upload } from "../config/multer.js";
import { cloudinaryImageUploader } from '../utils/cloudinaryImageUploader.js';
import { authorizePermission, authMiddleware } from '../middlewares/authenticationMiddleware.js';
const router = express.Router();

router.post('/register', authMiddleware, authorizePermission('handle_payments'), upload.single('image'),
    (req, res, next) => cloudinaryImageUploader(req, res, next, 'payroll_specialist_passport'), createPayrollSpecialist)
router.route('/login')
    .post(loginPayrollSpecialist)
router.get('/', authMiddleware, authorizePermission('handle_payments'), getAllPayrollSpecialists);
// router.get('/', authMiddleware, authorizePermission('handle_payments'), getAllRegistrars);

router.patch('/update/:id', authMiddleware, authorizePermission('handle_admins'), upload.single('image'), (req, res, next) => {
    if (req.file) {
        // console.log(req.file)
        cloudinaryImageUploader(req, res, next, 'payroll_specialist_passport')
    }
    next()
}, updatePayrollSpecialist);
router.patch('/change-password', authMiddleware, authorizePermission('handle_payments'), changePayrollSpecialistPassword);
router.patch('/reset-password/:id', authMiddleware, authorizePermission('handle_admins'), resetPayrollSpecialistPassword)

export default router;  