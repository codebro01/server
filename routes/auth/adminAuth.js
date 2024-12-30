import express from 'express';
import { createAdmin, loginAdmin } from '../../controllers/index.js';
import { upload } from "../../config/multer.js";
import { cloudinaryImageUploader } from '../../utils/cloudinaryImageUploader.js';

const router = express.Router();

router.post('/register', upload.single('image'), (req, res, next) => cloudinaryImageUploader(req, res, next, 'admin_passport'), createAdmin)
router.route('/login')
    .post(loginAdmin)
export default router;