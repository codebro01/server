// import { loginSuperAdmin } from "./authController.js";
import { getSingleAdmin, resetAdminPassword, toggleAdminStatus, createAdmin, updateAdmin, loginAdmin, getAllAdmins } from "./authController.js";
import { toggleRegistrarStatus, createRegistrar, getSingleRegistrar, loginRegistrar, getAllRegistrars, changeRegistrarPassword, resetRegistrarPassword, updateRegistrar } from "./registrarController.js";
import { filterEnumeratorsByStudents, downloadAttendanceSheet, filterAndDownload, getAllStudents, updateStudent, deleteStudent, createStudent } from './studentController.js'
import { getSinglePayrollSpecialist, togglePayrollSpecialistStatus, getAllPayrollSpecialists, createPayrollSpecialist, loginPayrollSpecialist, updatePayrollSpecialist, changePayrollSpecialistPassword, resetPayrollSpecialistPassword } from "./payrollSpecialistController.js";
import { enumeratorsByyHighestRegisteredStudents, lgasByHighestRegisteredStudents } from "./adminUniqueQueriesController.js";



export { enumeratorsByyHighestRegisteredStudents, lgasByHighestRegisteredStudents, filterEnumeratorsByStudents,getSingleAdmin, togglePayrollSpecialistStatus, toggleRegistrarStatus, getSingleRegistrar, updateAdmin, getAllAdmins, filterAndDownload, createAdmin, loginAdmin, createRegistrar, loginRegistrar, getAllStudents, updateStudent, deleteStudent, createStudent, getAllRegistrars, changeRegistrarPassword, resetRegistrarPassword, updateRegistrar, downloadAttendanceSheet, getAllPayrollSpecialists, createPayrollSpecialist, loginPayrollSpecialist, updatePayrollSpecialist, changePayrollSpecialistPassword, resetPayrollSpecialistPassword, getSinglePayrollSpecialist, resetAdminPassword, toggleAdminStatus}