/* ---------- MODULES ---------- */
const _ = require('lodash');
const auth = require('../middleware/auth');
const dotenv = require('dotenv');
const excel = require("exceljs");
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const sgMail = require('@sendgrid/mail');

/* ---------- CLASSES & INSTANCES ---------- */
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2020-08-27',
  });
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* ---------- CONSTANTS ---------- */

/* ---------- FUNCTIONS ---------- */

/* ---------- INITIALIZATION ---------- */
/* ----- Multer ----- */
const upload = multer({
    fileFilter: function (req, file, cb) {
        const fileTypes = /pjp|jpg|pjpeg|jpeg|jfif|png|webp/;
        const validMimeType = fileTypes.test(file.mimetype);

        if (validMimeType) {
            cb(null, true);
        }
        else {
            req.flash('posts', `File upload only supports ${fileTypes}. Try again with a valid file type.`);
            cb(null, false);
        }
    },

});

/* ---------- ROUTES ---------- */
// Page for displaying posts.
router.get('/', auth.isAuthenticated, (req, res) => {
    Post.find({}).populate('author').exec((err, posts) => {
        if (err) throw err;

        res.render('users/posts', {posts, user: req.user, flash: req.flash('posts')});
    });
});


// Create a post.
router.post('/', auth.isAuthenticated, upload.single('image'), async (req, res, next) => {
    let postObj = {
        author: req.user._id,
        title: req.body.title,
        childFirstName: req.body.childFirstName,
        childLastName: req.body.childLastName,
        childDOB: req.body.childDOB,
        childGender: req.body.childGender,
        childShirtSize: req.body.childShirtSize
    };

    if (req.file) {
        postObj.image = await sharp(req.file.buffer).resize(400, 400).toBuffer();
    }

    const post = new Post(postObj);

    //create stripe to checkout session
    const domainURL = process.env.DOMAIN;
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price: process.env.PRICE, //price id from Stripe dashboard
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${domainURL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domainURL}/cancel`
    });
    
    //email event information to user
    const msg = { 
        to: `${req.user.email}`, //recipient
        from: `${process.env.SENGRID_EMAIL}`, //verified sender
        subject: 'Three Rivers Youth Soccer Camp Registration Confirmation',
        html:`<div>
            <p>You have successfully registered ${req.body.childFirstName} ${req.body.childLastName} for the upcoming 2023 Summer Three Rivers Youth Soccer Camp.</p>
            <br>
            <p>When: 8am - 4pm, Saturday, July 22, 2023</p>
            <p>&ensp;&emsp;&emsp; 10am - 3pm, Sunday, July 23, 2023</p>
            <p>Where: <a href="https://goo.gl/maps/TShbtA3kQR8LVMQV9">Riverside Park, Lexington, WA</a></p>
            <br>
            <p>If you have any questions, contact us at <a href="mailto:kelsosoccerclub.registrar@gmail.com">kelsosoccerclub.registrar@gmail.com</a>.</p>
            <br>
            <p>Best regards,
            <p>Three Rivers Youth Soccer Camp Team</p>
            <p><a href="https://www.threeriversoccercamp.com">www.threeriversoccercamp.com</a></p>
        </div>`,
    }

    //save form, and then redirect to stripe checkout session
    post.save((err) => {
        // Check for invalid user input.
        if (err) {
            req.flash('posts', err.message);
            return res.status(409).redirect('/posts');
        }
        
        sgMail.send(msg);
        
        return res.redirect(303, session.url);
    });
});



// Get all posts.
router.get('/:id', auth.isAuthenticated, (req, res) => {
    Post.findById(req.params.id).populate('author').exec((err, post) => {
        if (err) throw err;

        res.render('users/post', {post, user: req.user});
    });
});


// Edit post.
router.put('/:id', auth.isAuthenticated, auth.isAdmin, upload.single('image'), async (req, res) => {
    if (req.file) {
        req.body.image = await sharp(req.file.buffer).resize(400, 400).toBuffer();
    }

    console.log(req.body);

    await Post.findByIdAndUpdate(req.params.id, req.body, (err) => {
        if (err) {
            console.error(err);
        }
    });

    res.redirect(`/posts/${req.params.id}`);
});


// Delete post. Admin action only
router.delete('/:id', auth.isAuthenticated, auth.isAdmin, (req, res) => {
    Post.findByIdAndDelete(req.params.id, (err) => {
        if (err) console.error(err);

        res.redirect('/posts');
    });
});

// Get a specific post.
router.get('/admin/:id', auth.isAdmin, (req, res) => {
    Post.findById(req.params.id, (err, post) => {
        if (err) throw err;

        res.json(post);
    });
});

module.exports = router;