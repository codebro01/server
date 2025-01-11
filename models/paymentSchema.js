import { Schema, model } from "mongoose";


const AttendanceSchema = new Schema({
    studentRandomId: {
        type: String,
        required: true,
    },
    studentId : {
        type: mSchema.Types.ObjectId,
        ref: 'Student'
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
    paymentType: {
        type: String,
    },

    amount: {
        type: String,
    },
    paymentStatus: {
        type: String
    },
    bankName: {
        type: String
    },
    accountNumber: {
        type: String
    },
    accountBvn: {
        type: String
    },
}, { timestamps: true });

export const Attendance = model('Attendance', AttendanceSchema);



