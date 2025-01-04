import mongoose from 'mongoose';

// Ward Schema
const WardSchema = new mongoose.Schema({
    name: {
        type: String,
    },
});

// LGA Schema
const LgaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    wards: {
        type: Array
    } 
});

// Model
export const Wards = mongoose.model('Wards', WardSchema)
export const KogiLga = mongoose.model('KogiLga', LgaSchema)
