const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Render Index Page (Homepage)
router.get('/', (req, res) => {
    res.render('index');
});

// Sign Up Route
router.get('/signup', (req, res) => {
    res.render('signup', { errorMessage: null });
});

router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if a user with the same username or email already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });

        if (existingUser) {
            // If user exists, send an error message
            return res.render('signup', { 
                errorMessage: 'Username or email already exists. Please choose a different one.' 
            });
        }

        // Create a new user if no existing user is found
        const user = new User({ username, email, password });
        await user.save();

        // Redirect to login page after successful signup
        res.redirect('/login');
    } catch (error) {
        // Handle any unexpected errors
        console.error(error);
        res.render('signup', { 
            errorMessage: 'An error occurred while signing up. Please try again later.' 
        });
    }
});

// Login Route
router.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');  // Redirect to dashboard if already logged in
    }
    res.render('login');  // Render the login page if not logged in
});
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
        return res.redirect('/login');
    }

    req.session.userId = user._id;
    res.redirect('/dashboard');
});

// Logout Route
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
