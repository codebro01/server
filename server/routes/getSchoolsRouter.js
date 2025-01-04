import { PrimarySchools,  AllSchools, Schools} from '../models/schoolsSchema.js';

import express from 'express';


const router  = express.Router();


router.get('/', async (req, res) => {
  try {

    const allSchools = await AllSchools.find({}).sort('schoolName')
    // Send the merged data as the response
    res.status(200).json({allSchools});
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({ error: 'Error processing data' });
  }
});

export default router;