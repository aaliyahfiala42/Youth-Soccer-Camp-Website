const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const sharp = require('sharp');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true,
        validate: {
            validator: function (value) {
                return validator.isEmail(value);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    password: {
        type: String,
        required: true
    },
    plan: {
        type: String,
        enum: {
            values: ['Free', 'Admin'],
            message: '{VALUE} is not supported'
        },
        default: 'Free'
    },
    posts: {
        type: [mongoose.Schema.Types.ObjectId],
        default: []
    }
}, {collection: 'users', timestamps: true});

/* ---------- HOOKS ---------- */
/* ----- Pre ----- */
userSchema.pre('save', async function (next) {
    // Condition will hold true when new user is created or password modification
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

/* ---------- FUNCTIONS ---------- */
/* ----- Instance Methods ----- */
userSchema.methods.verifyPassword = function (inputPassword, callback) {
    return bcrypt.compare(inputPassword, this.password, callback);
};

module.exports = mongoose.model('User', userSchema);