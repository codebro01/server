import mongoose from 'mongoose';


const StudentSchema = new mongoose.Schema({
    schoolId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "AllSchools" ,
        required: true
        },
    surname: { 
        type: String, 
        required: true
         },
    phone: {
        type:String,
        required: true,
    },
    ward: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wards",
        required: true,
    },
    otherNames: { 
        type: String, 
        required: true 
        },
    gender: {
        type: String,       // Set the default value
        required: true           // Make it required if necessary
    },
    dob: { 
        type: String, 
        required: true 
        },
    nationality: { 
        type: String, 
        required: true 
        },
    stateOfOrigin: { 
        type: String, 
        required: true 
        },
    lga: { 
        type: String, 
        required: true 
        },
    communityName: { 
        type: String, 
        required: true 
        },
    residentialAddress: { 
        type: String, 
        required: true 
        },
    presentClass: { 
        type: String, 
        required: true 
        },
    yearAdmitted: { 
        type: String, 
        required: true 
        },
    classAtAdmission: { 
        type: String, 
        required: true 
        },
    guardianContact: { 
        type: String, 
        required: true 
        },
    guardianOccupation: { 
        type: String, 
        required: true 
        },
    bankName: { 
        type: String, 
        required: true 
        },
    accountNumber: { 
        type: String, 
        required: true 
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

    
}, {timestamps: true});

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

