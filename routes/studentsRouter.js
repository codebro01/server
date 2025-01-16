import express from 'express';
import { getAllStudents, importPaymentSheet, filterAndView, filterAndDownload, updateStudent, filterEnumeratorsByStudents, deleteStudent, createStudent, downloadAttendanceSheet, enumeratorsByyHighestRegisteredStudents, lgasByHighestRegisteredStudents, uploadAttendanceSheet, getStudentsAttendance } from '../controllers/index.js';
import { authMiddleware, authorizePermission } from '../middlewares/authenticationMiddleware.js';
import { upload, uploadXLSX } from '../config/multer.js';
import { cloudinaryImageUploader } from '../utils/cloudinaryImageUploader.js';
import { XLSXUploader } from '../utils/excelFileUploader.js';


const router = express.Router();

router.route('/')
    .get(authMiddleware, authorizePermission('handle_students'), getAllStudents)
    .post(authorizePermission('handle_students'), upload.single('image'), (req, res, next) => cloudinaryImageUploader(req, res, next, 'student_passport'), createStudent)
router.route('/:id')
    .delete(authorizePermission('delete_operations'), deleteStudent)
router.route('/:id').patch(authMiddleware, authorizePermission('handle_students'), upload.single('image'), async (req, res, next) => {
    if (req.file) {
        await cloudinaryImageUploader(req, res, next, 'student_passport');
    }
    next();
}, updateStudent);
router.get('/download', authorizePermission('handle_admins'), filterAndDownload)
router.get('/admin-view-all-students', authorizePermission('handle_admins'), filterAndView)
router.get('/view-attendance-sheet', authorizePermission(['handle_admins', 'handle_payments', 'handle_students']), getStudentsAttendance)
router.get('/attendance-sheet', authMiddleware, authorizePermission('handle_students'), downloadAttendanceSheet);
router.post('/upload-attendance-sheet', uploadXLSX.single('file'), XLSXUploader, authorizePermission('handle_students'), uploadAttendanceSheet);
router.post('/upload-payment-sheet', uploadXLSX.single('file'), XLSXUploader, authorizePermission('handle_payments'), importPaymentSheet);
router.get('/from-to', authorizePermission('handle_students'), filterEnumeratorsByStudents);
router.get('/enumerators-student-count', authMiddleware, authorizePermission('handle_registrars'), enumeratorsByyHighestRegisteredStudents)
router.get('/top-lga-count', authMiddleware, authorizePermission('handle_registrars'), lgasByHighestRegisteredStudents)
export default router;


