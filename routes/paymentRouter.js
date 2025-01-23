import { getTotalAmountPaid, getLGAWithTotalPayments, viewPayments, getTotalStudentsPaidMonthly, getPaymentsByLGA, getTotalStudentPaid } from '../controllers/index.js';
import { authMiddleware, authorizePermission } from '../middlewares/authenticationMiddleware.js';
import express from 'express';


const router = express.Router();


router.get('/get-total-amount-paid', authMiddleware, authorizePermission('handle_payments'), getTotalAmountPaid);
router.get('/get-lga-with-total-payments', authMiddleware, authorizePermission('handle_payments'), getLGAWithTotalPayments);
router.get('/view-payments', authMiddleware, authorizePermission(['handle_payments', 'handle_registrars']), viewPayments);
router.get('/view-payments-by-lga', authMiddleware, authorizePermission('handle_payments'), getPaymentsByLGA);
router.get('/get-total-amount-paid-monthly', authMiddleware, authorizePermission('handle_payments'), getTotalStudentsPaidMonthly);
router.get('/get-total-student-paid', authMiddleware, authorizePermission('handle_payments'), getTotalStudentPaid);


export default router;

