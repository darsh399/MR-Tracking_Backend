import mongoose from 'mongoose';

const DataModel = mongoose.Schema({
    userName: {
        type: String,
        required: true,
        min: 3,
    },
    email: {
        type: String,
        required: true, 
    },
    mobileNo: {
        type: String,
        required: true, 
    },
    password: {
        type: String,
        required: true,
        min: 6,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    isActive:{
        type: Boolean,
        default: true,
    }
});


export default mongoose.model('User', DataModel);