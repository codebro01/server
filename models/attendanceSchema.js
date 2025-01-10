import { Schema, model } from "mongoose";
import { type } from "os";


const AttendanceSchema = new Schema({
    studentRandomId: {
        type: String,
        required: true,
    },
    enumeratorId: {
        type: String,
        required: true,
    },
    attdWeek: {
        type: Number
    },
    class: { type: String },
    month: {
        type: Number,
        requireed: true,
    },
    year: {
        type: Number,   
        required: true,
    },
    AttendanceScore: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
    },
    weekNumber: {
        type: Number
    },
    amount: {
        type: String,
    },
    paymentStatus: {
        type: String
    },
    lockStatus: {
        type: Boolean,
        default: false
    }


}, { timestamps: true });

export const Attendance = model('Attendance', AttendanceSchema);



