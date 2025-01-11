import { Payment } from "../models";

export const getTotalAmountPaid = async (req, res, next)  =>{

    try {
        const totalAmount = await Payment.aggregate([
            {
                $match: {
                    paymentStatus: 'Completed'  // Filtering only completed payments
                }
            },
            {
                $group: {
                    _id: null,  // Grouping by no specific field to get the total sum
                    totalAmountPaid: { $sum: '$amount' }  // Summing up the amounts
                }
            },
            {
                $project: {
                    _id: 0,  // Remove _id field from the output
                    totalAmountPaid: 1  // Returning the total amount
                }
            }
        ]);

        res.status(200).json({ message: totalAmount[0]?.totalAmountPaid || 0}) 
    } catch (error) {
        console.error('Error fetching total amount paid:', error);
        return 0;
    }
}

export const  getLGAWithTotalPayments = async () => {
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

        return lgaWithTotalPayments;
    } catch (error) {
        console.error('Error fetching LGA with total payments:', error);
        return next(error)
    }
}

async (req, res) => {
    try {
        const { page = 1, limit = 10, year, month, paymentStatus } = req.query;

        // Build the aggregation pipeline with filters
        const query = {};
        if (year) query.year = parseInt(year);  // Filter by year
        if (month) query.month = parseInt(month);  // Filter by month
        if (paymentStatus) query.paymentStatus = paymentStatus;  // Filter by payment status

        // Aggregation query to fetch payments
        const payments = await Payment.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'students',
                    localField: 'studentId',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            { $unwind: '$studentInfo' },
            {
                $project: {
                    paymentId: '$_id',
                    studentName: '$studentInfo.name',
                    lgaOfEnrollment: '$studentInfo.lgaOfEnrollment',
                    class: '$class',
                    month: '$month',
                    year: '$year',
                    amount: '$amount',
                    paymentStatus: '$paymentStatus',
                    date: '$date'
                }
            },
            { $sort: { date: -1 } },  // Sort by date descending
            { $skip: (page - 1) * limit },
            { $limit: parseInt(limit) }
        ]);

        const totalPayments = await Payment.countDocuments(query);  // Get total count for pagination

        return res.status(200).json({
            payments,
            totalPayments,
            totalPages: Math.ceil(totalPayments / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return res.status(500).json({ message: 'An error occurred while fetching payments' });
    }
};

