import express from 'express';
import { getAllStudents, filterAndDownload, updateStudent, deleteStudent, createStudent } from '../controllers/studentController.js';
import { authorizePermission } from '../middlewares/authenticationMiddleware.js';
import { upload } from '../config/multer.js';
import { cloudinaryImageUploader } from '../utils/cloudinaryImageUploader.js';


const router = express.Router();


router.route('/')
    .get(authorizePermission('handle_students') ,getAllStudents)
    .post(authorizePermission('handle_students'), upload.single('image'), (req, res, next) => cloudinaryImageUploader(req, res, next, 'admin_passport') ,createStudent)
router.route('/:id')
    .delete(authorizePermission('delete_operations'), deleteStudent)
    .patch(authorizePermission('handle_students'), upload.single('image'), (req, res, next) => {
        if(req.file) {
            cloudinaryImageUploader(req, res, next, 'admin_passport')
        }
        next()
    }, updateStudent);
router.get('/download', authorizePermission('handle_admins'), filterAndDownload)
    export default router;


