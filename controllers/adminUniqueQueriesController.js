import { Student } from '../models/studentsSchema.js';
import { Registrar } from '../models/registrarSchema.js';


export const lgasByHighestRegisteredStudents = async (req, res, next) => {
    try {
        const lgaCounts = await Student.aggregate([
            {
                $unwind: "$lga" // Unwind the lgas array to treat each LGA as a separate document
            },
            {
                $group: {
                    _id: "$lga", // Group by the LGA text value (LGA name)
                    totalStudents: { $sum: 1 }, // Count the number of students for each LGA
                },
            },
            {
                $sort: { totalStudents: -1 }, // Sort the LGAs by the number of students in descending order
            },
            {
                $limit: 5, // Optional: Limit to top 5 LGAs with the most students
            },
        ])

        return res.status(200).json({
            lgaCounts
        });
    } catch (error) {
        return next(error)
    }

}
export const enumeratorsByyHighestRegisteredStudents = async (req, res, next) => {
    try {

        // const topEnumerators = await Student.aggregate([
        //     {
        //         $group: {
        //             _id: "$createdBy", // Group by enumerator ID
        //             totalStudents: { $sum: 1 }, // Count the number of students for each enumerator
        //         },
        //     },
        //     {
        //         $sort: { totalStudents: -1 }, // Sort by total students in descending order
        //     },
        //     {
        //         $limit: 5 // Limit to top 5 enumerators with the most students
        //     },
        //     {
        //         $lookup: {
        //             from: "registrars", // Join with the enumerators collection
        //             localField: "_id", // Match the enumerator ID in the students schema
        //             foreignField: "_id", // Match it to the enumerator collection's _id field
        //             as: "enumeratorDetails", // Create a new field for enumerator details
        //         },
        //     },
        //     {
        //         $project: {
        //             _id: 1, // Include enumerator ID
        //             totalStudents: 1, // Include total students count
        //             enumeratorName: "$enumeratorDetails", // Get the enumerator's name from the joined array
        //             enumeratorId: { $arrayElemAt: ["$enumeratorDetails._id", 0] }, // Get the enumerator's ID from the joined array
        //         },
        //     },
        // ])

        const topEnumerators = await Student.aggregate([
            {
                $group: {
                    _id: "$createdBy", // Group by enumerator ID
                    totalStudents: { $sum: 1 }, // Count the number of students for each enumerator
                },
            },
            {
                $sort: { totalStudents: -1 }, // Sort by total students in descending order
            },
            {
                $limit: 5, // Limit to top 5 enumerators with the most students
            },
            {
                $lookup: {
                    from: "registrars", // Join with the registrars collection
                    localField: "_id", // Match the enumerator ID in the students schema
                    foreignField: "_id", // Match it to the registrars collection's _id field
                    as: "enumeratorDetails", // Create a new field for enumerator details
                },
            },
            {
                $project: {
                    _id: 1, // Include enumerator ID
                    totalStudents: 1, // Include total students count
                    enumeratorName: { $arrayElemAt: ["$enumeratorDetails.fullName", 0] }, // Get the enumerator's name
                    enumeratorId: { $arrayElemAt: ["$enumeratorDetails._id", 0] }, // Get the enumerator's ID
                },
            },
        ]);


        return res.status(200).json(topEnumerators)

    } catch (error) {
        return next(error)
    }

}