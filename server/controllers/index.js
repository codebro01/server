// import { loginSuperAdmin } from "./authController.js";
import { createAdmin, loginAdmin} from "./authController.js";
import { createRegistrar, loginRegistrar, getAllRegistrars, changeRegistrarPassword, resetRegistrarPassword } from "./registrarController.js";
import { downloadAttendanceSheet, filterAndDownload, getAllStudents, updateStudent, deleteStudent, createStudent} from './studentController.js'
export { filterAndDownload, createAdmin, loginAdmin, createRegistrar, loginRegistrar, getAllStudents, updateStudent, deleteStudent, createStudent, getAllRegistrars, changeRegistrarPassword, resetRegistrarPassword, downloadAttendanceSheet }