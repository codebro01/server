import { updateSchool, createSchool, deleteSchool, getAllSchools, getSingleSchool } from "../controllers/index.js";
import express from 'express';

import { authorizePermission, authMiddleware } from '../middlewares/authenticationMiddleware.js';
const router = express.Router();

router.post('/', authMiddleware, authorizePermission('handle_registrars'),  createSchool)
router.patch('/:id', authMiddleware, authorizePermission('handle_registrars'), updateSchool)
router.get('/', authMiddleware, authorizePermission('handle_registrars'), getAllSchools)
router.delete('/:id', authMiddleware, authorizePermission(['handle_registrars']), deleteSchool)
router.patch('/get-single-school', authMiddleware, authorizePermission('handle_registrars'), getSingleSchool);


export default router;