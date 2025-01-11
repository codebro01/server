import mongoose from 'mongoose';
import { Registrar } from './registrarSchema.js';

const StudentSchema = new mongoose.Schema({
    randomId: {
        type: String,
        required: true,
    },
    biometricfinger_index: {
        type: String,
    },
    biometricfinger_middle: {
        type: String,
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AllSchools",
        required: [true, "School cannot be empty"]
    },
    surname: {
        type: String,
        required: [true, "Surname cannot be empty"]
    },
    firstname: {
        type: String,
        required: [true, "Please fill other names"]

    },
    middlename: {
        type: String,
        required: [true, "Please fill other names"]

    },
    studentNin: {
        type: String,
        // required: [true, "Student NIN is required"]
        unique: true,
        validate: {
            validator: function (value) {
                return value.length === 11; // Ensures the length is exactly 10
            },
            message: 'NIN must be exactly 11 characters long.'
        }
    },
    ward: {
        type: String,
        required: [true, "Ward is required"]
    },
 
    gender: {
        type: String,       // Set the default value
        required: true           // Make it required if necessary
    },
    dob: {
        type: String,
        required: [true, "Date of birth is required"]

    },
    nationality: {
        type: String,
        required: [true, "Nationality cannot be empty"]
    },
    stateOfOrigin: {
        type: String,
    },
    lga: {
        type: String,
    },
    lgaOfEnrollment: {
        type: String,
        required: true,
    },
    communityName: {
        type: String,
        required: [true, "Community name is required"]
    },
    residentialAddress: {
        type: String,
        required: [true, "Residential address cannot be empty"]
    },
    presentClass: {
        type: String,
        required: [true, "Please select present class"]
    },
    // ! two new fields below, must fix before lauching today
    // classAtEnrollment: {
    //     type: String,
    //     required: [true, "Please select class at enrollment"]
    // },
    yearOfEnrollment: {
        type: String,
        required: [true, "Please select year of enrollment"]
    },
    // yearAdmitted: {
    //     type: String,
    //     required: [true, "Please select Year admitted"]
    // },

    parentContact: {
        type: String,
    },
    parentOccupation: {
        type: String,
        required: [true, "Please select Parent/caregiver occupation"]
    },
    parentPhone: {
        type: String,
        required: [true, "Parent/caregiver phone number cannot be empty"],
        validate: {
            validator: function (value) {
                return value.length === 10; // Ensures the length is exactly 10
            },
            message: 'Phone Number must be exactly 11 characters long.'
        }
    },
    parentName: {
        type: String,
        required: [true, "Parent/caregiver name cannot be empty"]
    },
    parentNin: {
        type: String,
        validate: {
            validator: function (value) {
                return value.length === 10; // Ensures the length is exactly 10
            },
            message: 'NIN must be exactly 11 characters long.'
        }
    },
    parentBvn: {
        type: String,
        validate: {
            validator: function (value) {
                return value.length === 10; // Ensures the length is exactly 10
            },
            message: 'BVN must be exactly 11 characters long.'
        }
    },
    bankName: {
        type: String,
    },
    accountNumber: {
        type: String,
        unique: true,
        validate: {
            validator: function (value) {
                return value.length === 10; // Ensures the length is exactly 10
            },
            message: 'Account Number must be exactly 10 characters long.'
        }    },
    passport: {
        type: String,
    },
    lastLogged: {
        type: Date,
        default: Date.now,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Registrars",
        required: [true, "School cannot be empty"]

    },


}, { timestamps: true });

StudentSchema.index({ ward: 1, lga: 1, presentClass: 1 });


StudentSchema.pre('save', function (next) {
    if (this.isModified('lastLogged')) {
        this.lastLogged = Date.now();
    }
    next();
});

// Method to update `lastLogged`
StudentSchema.methods.updateLastLogged = function () {
    this.lastLogged = Date.now();
    return this.save();
};

export const Student = mongoose.model('Students', StudentSchema);

