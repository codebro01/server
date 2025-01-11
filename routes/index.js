import  adminAuthRouter  from "./auth/adminAuth.js";
import registrarAuthRouter from './auth/registrarAuth.js'
import payrollSpecialistRouter from './payrollSpecialistRouter.js'
import studentsRouter from './studentsRouter.js'
import allSchoolsRouter from './getSchoolsRouter.js'
import wards from './getAllWardsRouter.js'
import paymentRouter from './paymentRouter.js';

export {adminAuthRouter, registrarAuthRouter, studentsRouter, allSchoolsRouter, wards, payrollSpecialistRouter, paymentRouter};