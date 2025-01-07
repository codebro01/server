
import { Schema, model } from 'mongoose';

const SchoolSchema = new Schema({
    schoolName: String,
    schoolCategory: String,
    schoolCode: String,
    LGA: String
})

const PrimarySchoolSchema = new Schema({
    schoolName: String,
    schoolCategory: String,
    schoolType: String,
    schoolCode: String,
    LGA: String
})


const AllSchoolsSchema = new Schema({
    schoolName: String,
    schoolCategory: String,
    schoolType: String,
    schoolCode: String,
    LGA: String
})

export const AllSchools = model('AllSchools', AllSchoolsSchema);
export const PrimarySchools = model('PrimarySchools', PrimarySchoolSchema);
export const Schools = model('Schools', SchoolSchema);