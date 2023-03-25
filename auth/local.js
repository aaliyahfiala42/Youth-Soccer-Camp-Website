const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
 
/* --- Vaidate isUser --- */
module.exports = function() {
    return new LocalStrategy({
        usernameField: 'email'
    },
    function (email, password, done) {
        User.findOne({email}, function (err, user) {
            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false);
            }
            if (!user.verifyPassword(password)) {
                return done(null, false);
            }
            // User is verified!
            return done(null, user);
        });
    }
    );
};

/* --- Vaidate isAdmin --- */
/*
module.exports.isAdmin = function () {
    return new LocalStrategy({
        plan: 'plan'
    },
    function (plan, done) {
        User.findOne({plan}, function(err, user) {
            if (err) {
                return done(err);
            }
            if ({plan} != admin) {
                return done(null, false);
            }
            return done(null, user);
        });}
    );
    };
    */
