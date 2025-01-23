import express from 'express';
import { loginWithUrl, createRegistrar, getSingleRegistrar, loginRegistrar, getAllRegistrars, changeRegistrarPassword, resetRegistrarPassword, updateRegistrar, toggleRegistrarStatus } from '../../controllers/index.js';
import { upload } from "../../config/multer.js";
import { cloudinaryImageUploader } from '../../utils/cloudinaryImageUploader.js';
import { authorizePermission, authMiddleware } from '../../middlewares/authenticationMiddleware.js';
const router = express.Router();

router.post('/register', authMiddleware, authorizePermission('handle_registrars'), upload.single('image'), // Multer middleware to handle single image upload (field name is 'image')
    (req, res, next) => cloudinaryImageUploader(req, res, next, 'registrar_passport'), createRegistrar)
router.route('/login')
    .post(loginRegistrar)
router.route('/login/webview')
    .get(loginWithUrl)
router.get('/', authMiddleware, authorizePermission(['handle_payments', 'handle_registrars']), getAllRegistrars)
router.get('/get-single/:id', authMiddleware, authorizePermission(['handle_registrars', 'handle_students']), getSingleRegistrar)
router.patch('/update/:id', authMiddleware, authorizePermission('handle_registrars'), updateRegistrar);

router.patch('/change-password', authMiddleware, changeRegistrarPassword);
router.patch('/reset-password', authMiddleware, authorizePermission('handle_registrars'), resetRegistrarPassword)
export default router;
router.patch('/toggle-status', authMiddleware, authorizePermission('handle_registrars'), toggleRegistrarStatus)