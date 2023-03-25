const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    childFirstName: {
        type: String,
        default: ''
    },
    childLastName: {
        type: String,
        default: ''
    },
    childDOB: {
        type: Date,
        default: '1900-01-01'
    },
    childGender: {
        type: String,
        enum: {
            values: ['Boy', 'Girl', 'Other'],
            message: '{VALUE} is not supported'
        },
        default: 'Other'
    },
    childShirtSize: {
        type: String,
        enum: {
            values: ['Extra Small', 'Small', 'Medium', 'Large', 'Extra Large', 'Other'],
            message: '{VALUE} is not supported'
        },
        default: 'Other'
    },
    payment: {
        type: String,
        default: "Unpaid"
    },
    /*Event Details*/
    title: {
        type: String,
        default: 'Untitled'
    },
    description: {
        type: String,
        default: ''
    },
    content: {
        type: String,
        default: ''
    }
}, {collection: 'posts', timestamps: true});

module.exports = mongoose.model('Post', postSchema);