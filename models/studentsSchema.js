import mongoose from 'mongoose';


const StudentSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AllSchools",
        required: [true, "School cannot be empty"]
    },
    surname: {
        type: String,
        required: [true, "Surname cannot be empty"]
    },
    studentNin: {
        type: String,
        required: [true, "Student NIN is required"]
    },
    ward: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wards",
    },
    otherNames: {
        type: String,
        required: [true, "Please fill other names"]
        
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
    classAtEnrollment: {
        type: String,
        required: [true, "Please select class at enrollment"]
    },
    yearOfErollment: {
        type: String,
        required: [true, "Please select class at enrollment"]
    },
    yearAdmitted: {
        type: String,
        required: [true, "Please select Year admitted"]
    },
    classAtAdmission: {
        type: String,
        required: [true, "Please select class at Admission"]
    },
    guardianContact: {
        type: String,
    },
    guardianOccupation: {
        type: String,
        required: [true, "Please select guardian occupation"]
    },
    guardianPhone: {
        type: String,
        required: [true, "Guardian phone number cannot be empty"]
    },
    guardianName: {
        type: String,
        required: [true, "Guardian name cannot be empty"]
    },
    guardianNin: {
        type: String,
        required: [true, "Guardian NIN cannot be empty"]
    },
    bankName: {
        type: String,
        required: [true, "Bank name is required"]
    },
    accountNumber: {
        type: String,
        required: [true, "Account Number is required"]
    },
    passport: {
        type: String,
    },
    lastLogged: {
        type: Date,
        default: Date.now,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
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

