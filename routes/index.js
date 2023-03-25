/* ---------- MODULES ---------- */
const _ = require('lodash');
const auth = require('../middleware/auth');
const excel = require("exceljs");
const express = require('express');
const passport = require('passport');

/* ---------- CLASSES & INSTANCES ---------- */
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');


/* ---------- CONSTANTS ---------- */
const DEV_VIEW_MODE = process.env.DEV_VIEW_MODE; // To automatically log in after server refresh
const DEV_USER_ID = process.env.DEV_USER_ID;

/* ---------- FUNCTIONS  ---------- */

/* ---------- INITIALIZATION ---------- */
/* ----- Express ----- */
router.use(function (req, res, next) {
    // Automatically authenticate if dev mode is on.
    if (!req.isAuthenticated() && _.includes(['user', 'admin'], DEV_VIEW_MODE) && DEV_USER_ID) {
        User.findById(DEV_USER_ID, (err, user) => {
            if (err) throw err;

            req.login(user, (err) => {
                if (err) return next(err);

                return next();
            });
        });
    }
    else {
        next();
    }
});

/* ---------- ROUTES ---------- */
/*
// With the middleware, if the user is not authenticated, they will be redirected to the front landing page.
router.get('/', auth.isLoggedIn, (req, res) => {
    res.render('users/dashboard', {user: req.user, flash: req.flash('dashboard')});
});
*/
// With the middleware, if the user is not authenticated, they will be redirected to the front landing page.
router.get('/', auth.isLoggedIn, (req, res) => {
    Post.find({}).populate('author').exec((err, posts) => {
        if (err) throw err;

        //get the number of registrations
        let regis_count = posts.length;

        //close registration after 100 registrations
        if (regis_count >= 100)
            res.render('users/closed', {posts, user: req.user, flash: req.flash('closed')});
        else
            res.render('users/dashboard', {posts, user: req.user, flash: req.flash('dashboard')});
    });
});

/* ----- VISITOR ROUTES ----- */
router.post('/login', passport.authenticate('local', {successRedirect: '/', failureRedirect: '/', failureFlash: 'Incorrect credentials.'}));

router.get('/about', (req, res) => {
    res.render('about');
});

router.get('/camps', (req, res) => {
    res.render('camps');
});

router.get('/contact', (req, res) => {
    res.render('contact');
});

router.get('/FAQ', (req, res) => {
    res.render('FAQ');
});

router.get('/register', (req, res) => {
    res.render('register');
});


router.get('/success', (req, res) => {
    res.render('success');
});

router.get('/cancel', (req, res) => {
    res.render('cancel');
});


/* ----- USER ROUTES ----- */
router.get('/logout', auth.isAuthenticated, (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

router.get('/profile', auth.isAuthenticated, (req, res) => {
    res.render('users/profile', {user: req.user});
});

router.get('/settings', auth.isAuthenticated, (req, res) => {
    res.render('users/settings', {user: req.user, flash: req.flash('settings')});
});


// Export posts to csv
router.get('/exporttocsv', auth.isAuthenticated, auth.isAdmin, (req, res) => {    
    Post.find({}).populate('author').then((objs) => {
        let posts = [];

        objs.forEach((obj) => {
            posts.push({
                parentFirstName: obj.author.firstName,
                parentLastName: obj.author.lastName,
                parentEmail: obj.author.email,
                childFirstName: obj.childFirstName,
                childLastName: obj.childLastName,
                childDOB: obj.childDOB,
                childGender: obj.childGender,
                childShirtSize: obj.childShirtSize,
                payment: obj.payment,

            });
        });

        let workbook = new excel.Workbook();
        let worksheet = workbook.addWorksheet("Registrations");
        
        worksheet.columns = [
            {header: "Parent First Name", key: "parentFirstName", width: 15},
            {header: "Parent Last Name", key: "parentLastName", width: 15},
            {header: "Parent Email", key: "parentEmail", width: 30},
            {header: "Child First Name", key: "childFirstName", width: 15},
            {header: "Child Last Name", key: "childLastName", width: 15},
            {header: "Child DOB", key: "childDOB", width: 15},
            {header: "Child Gender", key: "childGender", width: 15},
            {header: "Child Shirt Size", key: "childShirtSize", width: 15},
            {header: "Payment Status", key: "payment", width: 15},

        ];
        
        //add data rows
        worksheet.addRows(posts);
        
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
    
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "Registrations.xlsx"
        );
    
        return workbook.xlsx.write(res).then(function () {
            res.status(200).end();
        });
    });
});

/*
// Webhook handler for asynchronous events.
router.post('/webhook', async (req, res) => {
    let event = req.body;

    try {
        //get customer details
        if (event.type = 'invoice.payment_succeeded') {
            console.log("invoice succeeded")
            console.log(event.data.object.receipt_email);
            let payment_email = event.data.object.receipt_email;
            await Post.find({}).populate('email').update(
                {email: payment_email},
                {$set: {"payment":"Paid"}} 
            );
        }
    } catch (err) {
        res.status(200).send(`Webhook Error: ${err.message}`);
        return;
    }

    res.send(200);

  });
*/
module.exports = router;