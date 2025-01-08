import { Schema, model } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';


export const AdminSchema = new Schema({
    fullName: {
        type: String,
        required: [true, 'lastname is required'],
    },
    // lastname: {
    //     type: String,
    //     required: [true, 'lastname is required'],
    // },
    email: {
        type: String,
        required: [true, 'Email is required'],
        validate: {
            validator: validator.isEmail,
            message: 'Please provide a valid email',
            unique: true,
        },
        unique: true
    },
    password: {
        type: String,
    },
    randomId: {
        type: Number,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    roles: [{
        type: Schema.Types.ObjectId,
        ref: "Roles"
    }],
    permissions: [],
    passport: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });


AdminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt)

    next();
})

AdminSchema.methods.comparePWD = async function (inputedPassword) {
    const compare = bcrypt.compare(inputedPassword, this.password);
    return compare;
}

export const Admin = model("Admin", AdminSchema)