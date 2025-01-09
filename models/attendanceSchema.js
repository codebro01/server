import { Schema, model } from "mongoose";


const AttendanceSchema = new Schema ({
    studentRandomId: {
        type: String,
        required: true,
    },
    enumeratorId: {
        type: String, 
        required: true,
    },
    week_1:{
        type: Number
    },
    week_2:{
        type: Number
    },
    week_3:{
        type: Number
    },
    week_4:{
        type: Number
    },
    week_5:{
        type: Number
    },
    month: {
        type: String
    },
    year: {
        type: Number
    },
    date: {
        type: Date,
        default: new Date(Date.now)
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
        type: String
    }


}, {timestamps: true})



