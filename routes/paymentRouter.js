import { getTotalAmountPaid, getLGAWithTotalPayments, viewPayments, getTotalStudentsPaidMonthly } from '../controllers/index.js';
import { authMiddleware, authorizePermission } from '../middlewares/authenticationMiddleware.js';
import express from 'express';


const router  = express.Router();


router.get('/getTotalAmountPaid',authMiddleware, authorizePermission('handle_payments'), getTotalAmountPaid);
router.get('/getLGAWithTotalPayments', authorizePermission('handle_payments'), getLGAWithTotalPayments);
router.get('/viewPayments', authorizePermission('handle_payments'), viewPayments);
router.get('/getTotalAmountPaidMonthly', authorizePermission('handle_payments'), getTotalStudentsPaidMonthly);

export default router;

