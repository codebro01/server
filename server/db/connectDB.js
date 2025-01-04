import {connect} from 'mongoose';

export const connectDB = (MONGO_URI) => {
    return connect(MONGO_URI);
}