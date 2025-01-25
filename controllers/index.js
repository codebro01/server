// import { loginSuperAdmin } from "./authController.js";
import { getSingleAdmin, resetAdminPassword, toggleAdminStatus, createAdmin, updateAdmin, loginAdmin, getAllAdmins } from "./authController.js";
import {loginWithUrl, toggleRegistrarStatus, createRegistrar, getSingleRegistrar, loginRegistrar, getAllRegistrars, changeRegistrarPassword, resetRegistrarPassword, updateRegistrar } from "./registrarController.js";
import { totalStudentsByEnumerators, importPaymentSheet, getStudentsStats, filterAndView, getStudentsAttendance, uploadAttendanceSheet, filterEnumeratorsByStudents, downloadAttendanceSheet, filterAndDownload, getAllStudents, updateStudent, deleteStudent, createStudent, getDuplicateRecord, deleteManyStudents } from './studentController.js'
import { getSinglePayrollSpecialist, togglePayrollSpecialistStatus, getAllPayrollSpecialists, createPayrollSpecialist, loginPayrollSpecialist, updatePayrollSpecialist, changePayrollSpecialistPassword, resetPayrollSpecialistPassword } from "./payrollSpecialistController.js";
import { enumeratorsByyHighestRegisteredStudents, lgasByHighestRegisteredStudents } from "./adminUniqueQueriesController.js";
import { getTotalAmountPaid, getTotalStudentsPaidMonthly, getLGAWithTotalPayments, viewPayments, getPaymentsByLGA, getTotalStudentPaid } from "./paymentController.js";
import { updateSchool, createSchool, deleteSchool, getAllSchools, getSingleSchool } from "./schoolController.js";


export { getTotalStudentPaid, getPaymentsByLGA, totalStudentsByEnumerators, getStudentsStats, importPaymentSheet, filterAndView, getTotalAmountPaid, getTotalStudentsPaidMonthly, getLGAWithTotalPayments, viewPayments, loginWithUrl, getStudentsAttendance, uploadAttendanceSheet, enumeratorsByyHighestRegisteredStudents, lgasByHighestRegisteredStudents, filterEnumeratorsByStudents, getSingleAdmin, togglePayrollSpecialistStatus, toggleRegistrarStatus, getSingleRegistrar, updateAdmin, getAllAdmins, filterAndDownload, createAdmin, loginAdmin, createRegistrar, loginRegistrar, getAllStudents, updateStudent, deleteStudent, createStudent, getAllRegistrars, changeRegistrarPassword, resetRegistrarPassword, updateRegistrar, downloadAttendanceSheet, getAllPayrollSpecialists, createPayrollSpecialist, loginPayrollSpecialist, updatePayrollSpecialist, changePayrollSpecialistPassword, resetPayrollSpecialistPassword, getSinglePayrollSpecialist, resetAdminPassword, toggleAdminStatus, updateSchool, createSchool, deleteSchool, getAllSchools, getSingleSchool, getDuplicateRecord, deleteManyStudents }