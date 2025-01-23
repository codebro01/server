import { Schema, model } from "mongoose";


const PaymentSchema = new Schema({
    studentRandomId: {
        type: String,
        required: true,
    },
    firstname: {
        type: String,
    },
    surname: {
        type: String,
    },
    middlename: {
        type: String,
    },
    paymentType: {
        type: String,
    },
    totalAttendanceScore: {
        type: Number,
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
    totalAttendanceScore: {
        type: Number,

    },
    bankName: {
        type: String,

    },
    accountNumber: {
        type: Number,

    },
    schoolName: {
        type: String,

    },
    ward: {
        type: String,

    },
    LGA: {
        type: String,

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

PaymentSchema.index({ date: 1 });

export const Payment = model('Payment', PaymentSchema);



