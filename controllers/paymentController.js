import { Attendance } from "../models/attendanceSchema.js";
import { Payment } from "../models/paymentSchema.js";

export const getTotalAmountPaid = async (req, res, next) => {
    try {
        const currentYear = new Date().getFullYear(); // Get the current year dynamically
        const startOfYear = new Date(`${currentYear}-01-01T00:00:00Z`);
        const endOfYear = new Date(`${currentYear}-12-31T23:59:59Z`);

        const totalAmount = await Payment.aggregate([
            {
                $match: {
                    paymentStatus: 'Completed', // Filtering only completed payments
                    paymentDate: {
                        $gte: startOfYear,
                        $lte: endOfYear,
                    }, // Filtering payments within the current year
                },
            },
            {
                $group: {
                    _id: null, // Grouping by no specific field to get the total sum
                    totalAmountPaid: { $sum: '$amount' }, // Summing up the amounts
                },
            },
            {
                $project: {
                    _id: 0, // Remove _id field from the output
                    totalAmountPaid: 1, // Returning the total amount
                },
            },
        ]);

        res.status(200).json({ totalAmountPaid: totalAmount[0]?.totalAmountPaid || 0 });
    } catch (error) {
        console.error('Error fetching total amount paid:', error);
        res.status(500).json({ message: 'Error fetching total amount paid' });
    }
};


export const getLGAWithTotalPayments = async (req, res, next) => {
    try {
        const lgaWithTotalPayments = await Payment.aggregate([
            {
                $lookup: {
                    from: 'students',  // The collection to join
                    localField: 'studentId',  // The field in Payment schema
                    foreignField: '_id',  // The field in Student schema
                    as: 'studentInfo'  // Alias for joined documents
                }
            },
            {
                $unwind: '$studentInfo'  // Unwind the studentInfo array if needed
            },
            {
                $group: {
                    _id: '$studentInfo.lgaOfEnrollment',  // Group by LGA of enrollment
                    totalAmountPaid: { $sum: '$amount' }  // Sum up the payment amounts
                }
            },
            {
                $project: {
                    lgaOfEnrollment: '$_id',  // Returning the grouped LGA as field name
                    totalAmountPaid: 1,  // Include the total payment sum
                    _id: 0  // Exclude the default _id field from the output
                }
            }
        ]);
        // lgaWithTotalPayments
        res.status(200).json({ message: "sent", lgaWithTotalPayments });
    } catch (error) {
        console.error('Error fetching LGA with total payments:', error);
        return next(error)
    }
}

// export const viewPayments = async (req, res, next) => {
//     try {
//         const { page, limit, year, month, paymentStatus, LGA, ward, schoolName, totalAttendanceScore, bankName, presentClass, amount, paymentType, dateFrom, dateTo } = req.query;

//         // Build the aggregation pipeline with filters
//         const basket = {};
//         if (year) basket.year = parseInt(year);  // Filter by year
//         if (month) basket.month = parseInt(month);  // Filter by month
//         if (paymentStatus) basket.paymentStatus = paymentStatus;  // Filter by payment status
//         if (totalAttendanceScore) basket.totalAttendanceScore = totalAttendanceScore;  // Filter by payment status
//         if (bankName) basket.bankName = bankName;  // Filter by payment status
//         if (paymentType) basket.paymentType = paymentType;  // Filter by payment status
//         if (LGA) basket.LGA = LGA;  // Filter by payment status
//         if (ward) basket.ward = ward;  // Filter by payment status
//         if (schoolName) basket.schoolName = schoolName;  // Filter by payment status
//         if (presentClass) basket.class = presentClass;  // Filter by payment status
//         if (amount) basket.amount = parseInt(amount);  // Filter by payment status
//      if (dateFrom || dateTo) {
//                basket.createdAt = {};

//                // Handle dateFrom
//                if (dateFrom) {
//                    const fromDate = new Date(dateFrom);
//                    if (isNaN(fromDate)) {
//                        return next(new BadRequestError('Invalid dateFrom format'));
//                    }
//                    basket.createdAt.$gte = fromDate;
//                }

//                // Handle dateTo
//                if (dateTo) {
//                    const toDate = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
//                    if (isNaN(toDate)) {
//                        return next(new BadRequestError('Invalid dateTo format'));
//                    }
//                    basket.createdAt.$lte = toDate;
//                }

//                // Clean up empty `createdAt` filter
//                if (Object.keys(basket.createdAt).length === 0) {
//                    delete basket.createdAt;
//                }
//            }
//         const pageNumber = parseInt(page, 10) || 1;
//         const limitNumber = parseInt(limit, 10) || 200;

//         // console.log(basket, req.query)


//         const totalPayments = await Payment.countDocuments();

//         // console.log(totalPayments)
//         const getAllPaymentsRecords = await Payment.find(basket).skip((pageNumber - 1) * limitNumber).limit(limitNumber).select('-__v -_id -lockStatus -date -updatedAt').collation({ locale: "en", strength: 2 }).lean();

//         return res.status(200).json({
//             getAllPaymentsRecords, totalPayments
//         });
//     } catch (error) {
//         console.error('Error fetching payments:', error);
//         return res.status(500).json({ message: 'An error occurred while fetching payments' });
//     }
// };

export const viewPayments = async (req, res, next) => {
    try {
        const { page, limit, year, month, paymentStatus, LGA, ward, schoolName, totalAttendanceScore, bankName, presentClass, amount, paymentType, dateFrom, dateTo } = req.query;

        // Build the match stage with filters
        const matchStage = {};
        if (year) matchStage.year = parseInt(year);  // Filter by year
        if (month) matchStage.month = parseInt(month);  // Filter by month
        if (paymentStatus) matchStage.paymentStatus = paymentStatus;  // Filter by payment status
        if (totalAttendanceScore) matchStage.totalAttendanceScore = parseInt(totalAttendanceScore);  // Filter by total attendance score
        if (bankName) matchStage.bankName = bankName;  // Filter by bank name
        if (paymentType) matchStage.paymentType = paymentType;  // Filter by payment type
        if (LGA) matchStage.LGA = LGA;  // Filter by LGA
        if (ward) matchStage.ward = ward;  // Filter by ward
        if (schoolName) matchStage.schoolName = schoolName;  // Filter by school name
        if (presentClass) matchStage.class = presentClass;  // Filter by class
        if (amount) matchStage.amount = parseInt(amount);  // Filter by amount

        // Handle date range filters
        if (dateFrom || dateTo) {
            matchStage.createdAt = {};
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                if (isNaN(fromDate)) {
                    return next(new BadRequestError('Invalid dateFrom format'));
                }
                matchStage.createdAt.$gte = fromDate;
            }
            if (dateTo) {
                const toDate = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
                if (isNaN(toDate)) {
                    return next(new BadRequestError('Invalid dateTo format'));
                }
                matchStage.createdAt.$lte = toDate;
            }
        }

        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 200;

        // Build the aggregation pipeline
        const pipeline = [
            { $match: matchStage }, // Match stage
            {
                $project: {
                    __v: 0, // Exclude __v
                    _id: 0, // Exclude _id
                    lockStatus: 0, // Exclude lockStatus
                    date: 0, // Exclude date
                    updatedAt: 0 // Exclude updatedAt
                }
            },
            {
                $sort: { createdAt: -1 } // Sort by createdAt in descending order (optional)
            },
            {
                $facet: {
                    totalAmount: [
                        {
                            $group: {
                                _id: null,
                                totalAmount: { $sum: { $toDouble: '$amount' } } // Convert string to number for aggregation
                            }
                        }
                    ],
                    metadata: [
                        { $count: "totalPayments" } // Count total records
                    ],
                    data: [
                        { $skip: (pageNumber - 1) * limitNumber }, // Skip for pagination
                        { $limit: limitNumber } // Limit for pagination
                    ]
                }
            }
        ];

        

        const result = await Payment.aggregate(pipeline).collation({ locale: "en", strength: 2 });


        const metadata = result[0]?.metadata[0] || { totalPayments: 0 };
        const data = result[0]?.data || [];
        const amountSum = result[0]?.totalAmount || 0;

        return res.status(200).json({
            getAllPaymentsRecords: data,
            totalPayments: metadata.totalPayments,
            amountSum,
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return res.status(500).json({ message: 'An error occurred while fetching payments' });
    }
};


export const getTotalStudentsPaidMonthly = async (req, res, next) => {
    try {
        const getCurrentMonth = () => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // First day of the current month
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of the current month
            return { startOfMonth, endOfMonth };
        };


        const { startOfMonth, endOfMonth } = getCurrentMonth();

        const totalStudents = await Payment.aggregate([
            {
                $match: {
                    paymentStatus: 'Completed', // Only include completed payments
                    paymentDate: {
                        $gte: startOfMonth, // Payments made on or after the start of the month
                        $lte: endOfMonth,  // Payments made on or before the end of the month
                    },
                },
            },
            {
                $group: {
                    _id: '$studentId', // Group by studentId to count unique students
                },
            },
            {
                $count: 'totalStudentsPaid', // Count the number of unique student IDs
            },
        ]);

        res.status(200).json({
            message: 'Total students who paid for the current month',
            totalStudentsPaid: totalStudents[0]?.totalStudentsPaid || 0, // Handle cases with no payments
        });
    } catch (error) {
        console.error('Error fetching total students paid:', error);
        res.status(500).json({ message: 'Error fetching data' });
    }
};

export const getPaymentsByLGA = async (req, res, next) => {
    try {
        const pipeline = [
            {
                $addFields: {
                    amountAsNumber: { $toDouble: "$amount" }, // Convert string amount to number
                },
            },
            {
                $group: {
                    _id: { $toLower: '$LGA' }, // Group by LGA
                    totalAmount: { $sum: "$amountAsNumber" }, // Sum the converted amount
                },
            },
            {
                $sort: { totalAmount: -1 }, // Sort LGAs by total amount in descending order
            },
        ];

        const paymentByLGA = await Payment.aggregate(pipeline);
        res.status(200).json({ paymentByLGA });
    } catch (error) {
        console.error("Error fetching payments by LGA:", error);
        return next(error);
    }
};
export const getTotalStudentPaid = async (req, res, next) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: '$studentRandomId', // Group by LGA
                },
            },
        ];

        const totalStudentPaid = await Payment.aggregate(pipeline);
        res.status(200).json({ totalStudentPaid });
    } catch (error) {
        console.error("Error fetching payments by LGA:", error);
        return next(error);
    }
};








