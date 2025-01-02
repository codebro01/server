import { logSchema } from './index.js';
import { Schema, model } from 'mongoose';
import bcrypt from "bcryptjs";


const RegistrarSchema = new Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],

    },


    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        lowercase: true,
        unique: false
    },
    lga: {
        type: String,
        required: [true, 'lga is required'],
        lowercase: true,
        unique: false
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Others'],
        // required: [true, 'Gender is required'],
    },
    phone: {
        type: String,
        // required: [true, 'Phone number is required'],
        // unique: true,
    },
    passport: {
        type: String,
    },
    address: {
        type: String,
        // required: [true, 'Address is required'],
    },
    bankName: {
        type: String,
        required: [true, 'Bank name is required'],
    },
    // bvn:{
    //     type:String, 
    //     required:[true, 'Bvn is required'], 
    //     unique: true,
    // }, 
    // nin:{
    //     type:String, 
    //     required:[true, 'Nin is required'], 
    //     unique: true,
    // }, 
    accountNumber: {
        type: Number,
        required: [true, 'Account Number is required'],
        unique: true,
    },
    status: {
        type: String,
        enum: ['Active', 'Suspended'],
        default: 'Active',
    },
    randomId: {
        type: Number,
    },
    lastLogged: {
        type: Date,
        default: Date.now,
    },
    roles: [{
        type: Schema.Types.ObjectId,
        ref: "Roles"
    }],

    logs: [logSchema],

    permissions: [],

    other: {
        type: Schema.Types.Mixed, // Can store any type of data
    },
});

RegistrarSchema.pre('save', async function (next) {
    if (!this.isNew && !this.isModified('password')) return next();

    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('Hashed Password:', this.password);
    }
    next();
});




RegistrarSchema.methods.comparePWD = async function (inputedPassword) {
    const compare = bcrypt.compare(inputedPassword, this.password);
    return compare;
}

// Middleware to update `lastLogged` on save
RegistrarSchema.pre('save', function (next) {
    if (this.isModified('lastLogged')) {
        this.lastLogged = Date.now();
    }
    next();
});

// Method to update `lastLogged`
RegistrarSchema.methods.updateLastLogged = function () {
    this.lastLogged = Date.now();
    return this.save();
};

RegistrarSchema.methods.addLog = async function (log) {
    this.logs.push(log);
    if (this.logs.length > 5) {
        this.logs.shift(); // Remove the oldest log
    }
};

export const Registrar = model('Registrars', RegistrarSchema);
