// import { loginSuperAdmin } from "./authController.js";
import { createAdmin, loginAdmin, createRegistrar, loginRegistrar, getAllRegistrars, changeRegistrarPassword, resetRegistrarPassword } from "./authController.js";
import { getAllStudents, updateStudent, deleteStudent, createStudent} from './studentController.js'
export { createAdmin, loginAdmin, createRegistrar, loginRegistrar, getAllStudents, updateStudent, deleteStudent, createStudent, getAllRegistrars, changeRegistrarPassword, resetRegistrarPassword }