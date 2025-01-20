import { AllSchools } from "../models/index.js";
import { StatusCodes } from "http-status-codes";

export const getAllSchools = async (req, res, next) => {

    try {
        const allSchools = await AllSchools.find({})
        res.status(200).json({ allSchools });
    }
    catch (err) {
        return next(err)
    }
}

export const getSingleSchool = async (req, res, next) => {

    try {
        const { id } = req.params;
        const school = await AllSchools.findById({ _id: id })
        if (!school) return next(new NotFoundError(`There is no school with id: ${id}`));
        res.status(200).json(school)
    }
    catch (err) {
        return next(err)
    }
}


export const createSchool = async (req, res, next) => {

    try {



        const isExistingSchool = await AllSchools.findOne({ schoolCode: req.body.schoolCode });
        if (isExistingSchool) return next(new BadRequestError('School already exist'))


        const newSchool = await AllSchools.create({ ...req.body });

        if (!newSchool) return next(new BadRequestError('An error occured adding School'));
        res.status(200).json({ newSchool, message: 'School added successfully' });


    }
    catch (err) {
        return next(err)
    }
}

export const updateSchool = async (req, res, next) => {

    try {

        const { id } = req.params;
        const isExistingSchool = await AllSchools.findOne({ _id: id });
        if (!isExistingSchool) return next(new BadRequestError(`No school with id: ${id}`))


        const updateSchool = await AllSchools.findOneAndUpdate({ _id: id }, { ...req.body }, { new: true, runValidators: true });

        if (!updateSchool) return next(new BadRequestError('An error occured updating School'));
        res.status(200).json({ newSchool });


    }
    catch (err) {
        return next(err)
    }
}

export const deleteSchool = async (req, res, next) => {
    try {
        const { id } = req.params;

        const school = await AllSchools.findById({ _id: id });
        if (!school) return next(new NotFoundError(`School not found`));

        await AllSchools.findByIdAndDelete({ _id: id });
        res.status(StatusCodes.OK).json({id: id,  message: `School successfully deleted` });
    }
    catch (err) {
        return next(err)
    }
}