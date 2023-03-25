/* ---------- MODULES ---------- */
const bodyParser = require('body-parser');
const chalk = require('chalk');
const compression = require('compression');
const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const favicon = require('serve-favicon');
const flash = require('connect-flash');
const fs = require('fs-extra');
const helmet = require('helmet');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const morgan = require('morgan');
const nodeMail = require('nodemailer');
const passport = require('passport');
const path = require('path');
const session = require('express-session');
const sgMail = require('@sendgrid/mail');


/* ---------- CLASSES & INSTANCES ---------- */
const app = express();

/* ---------- CONSTANTS ---------- */
const DOTENV_RESULT = dotenv.config();
const PORT = 3000;

const DB_NAME = 'myMongoDB';
const MONGO_URI = process.env.MONGO_URI || `mongodb://127.0.0.1:27017/${DB_NAME}`;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const passportInit = require('./auth/init');
const passportLocal = require('./auth/local');
/* ---------- FUNCTIONS ---------- */


function updateFontAwesome() {
    fs.copy('./node_modules/@fortawesome/fontawesome-free/css/all.min.css', 'public/styles/fontawesome.css', (err) => {
        if (err) throw err;
    });

    fs.copy('./node_modules/@fortawesome/fontawesome-free/webfonts', 'public/webfonts', (err) => {
        if (err) throw err;
    });
}

/* ---------- INITIALIZATION ---------- */

/* ----- Dotenv ----- */
if (DOTENV_RESULT.error) {
    console.error(chalk.red(`${DOTENV_RESULT.error}`));
}

/* ----- Express ----- */
app.set('view engine', 'ejs');
app.use('/', express.static(path.join(__dirname, 'public'))); // URL path begins at /public.

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Middleware
//app.use(bodyParser.urlencoded({extended: false})); // Parse application/x-www-form-urlencoded.
app.use(bodyParser.urlencoded()); // Parse application/x-www-form-urlencoded.
app.use(bodyParser.json()); // Parse application/json.
app.use(cors());
app.use(compression()); // Compress all responses.
app.use(favicon(path.join(__dirname, 'public', 'assets', 'Kelso_Logo.jpg'))); 
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);
app.use(flash());
app.use(methodOverride('_method', {methods: ['POST', 'GET']})); // Process POST request suffixed with ?_method=DELETE or ?_method=PUT.
app.use(morgan('dev'));
app.use(session({
    name: 'qid',
    secret: process.env.SESSION_SECRET || 'dQw4w9WgXcQ', // run `node -e "console.log(crypto.randomBytes(32).toString('hex'))"` in console to generate secret.
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 2 * 365 // 2 years
    }
}));


/* ----- Enforce HTTPS ----- */
function isSecure(req) {
    if (req.headers['x-forwarded-proto']) {
        return req.headers['x-forwarded-proto'] === 'https';
     }
     return req.secure;
};
/*
app.use(function(req, res, next) {
    if (process.env.NODE_ENV != 'development' && !isSecure(req)) {
        res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
});
*/


/* ----- Mongoose ----- */
mongoose.connect(MONGO_URI, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Mongo DB connected!"))
.catch((err) => console.log(err));

/* ----- Passport ----- */
app.use(passport.initialize());
app.use(passport.session());

passport.use(passportLocal());
passportInit();

/* ---------- ROUTES ---------- */
app.use('/', require('./routes/index'));
app.use('/posts', require('./routes/posts'));
app.use('/users', require('./routes/users'));

/* ---------- EMAIL CONTACT FORM ----------*/
app.post('/contact', (req, res) => {
    console.log(req);

    const msg = { 
        to: `${process.env.SENGRID_EMAIL}`, //recipient
        from: `${process.env.SENDGRID_EMAIL}`, //verified sender
        subject: 'Three Rivers Youth Soccer Camp Contact Form',
        text: 
        `Name: ${req.body.ContactFName} ${req.body.ContactLName}\nEmail: ${req.body.ContactEmail}\nPhone: ${req.body.ContactPhone}\nMessage: ${req.body.ContactMessage}`,
    }
    try {
        sgMail.send(msg);

        res.render('contact');
    } catch(error) {
        res.send("Message could not be sent");
    }
});

// Redirect invalid pages
app.use((req, res) => {
    res.format({
        html: () => {
            res.status(404);
            res.render('404');
        },
        json: () => {
            res.json({error: 'Not found'});
        },
        default: () => {
            res.type('txt').send('Not found');
        }
    });
});

/* ---------- LAUNCH ---------- */
app.listen(PORT, () => {
    console.log(chalk.blue(`Server running at http://localhost:${PORT}/`));
});
