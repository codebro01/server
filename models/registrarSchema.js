import {logSchema} from './index.js';
import {Schema, model} from 'mongoose';
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


    firstname: {
        type: String,
        required: [true, 'Firstname is required'],
        trim: true,
        lowercase: true,
        unique: false
    },
    lastname: {
        type: String,
        required: [true, 'lastname is required'],
        trim: true,
        lowercase: true,
        unique: false
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: [true, 'Gender is required'],
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
    },
    passport: {
        type: String,
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
    },
    bank: {
        type: String,
        required: [true, 'Bank is required'],
    },
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
    if(!this.isModified('password')) return next()
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt)

    next();
})

RegistrarSchema.methods.comparePWD = async function(inputedPassword) {
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

export const Registrar =  model('Registrars', RegistrarSchema);
