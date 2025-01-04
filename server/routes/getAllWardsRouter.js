import { Wards } from '../models/LgaSchema.js';

import express from 'express';


const router  = express.Router();


router.get('/', async (req, res) => {
  try {

    const wards = await Wards.find({}).sort('name')
    // Send the merged data as the response
    res.status(200).json({wards});
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({ error: 'Error processing data' });
  }
});

export default router;