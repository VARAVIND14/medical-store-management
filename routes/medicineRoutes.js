const express = require('express');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const router = express.Router();

// Middleware to check if user is logged in
const checkAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Dashboard Route
router.get('/dashboard', checkAuth, async (req, res) => {
    const user = await User.findById(req.session.userId);
    res.render('dashboard', { user });
});

// Add Medicine Route (GET)
router.get('/add-medicine', checkAuth, (req, res) => {
    res.render('addMedicine', { error: null });
});

// Add Medicine Route (POST)
router.post('/add-medicine', checkAuth, async (req, res) => {
    const { name , stock } = req.body;

    // Check if the user has already added 5 medicines
    const medicineCount = await Medicine.countDocuments({ user: req.session.userId });

    if (medicineCount >= 5) {
        return res.render('addMedicine', { error: 'You can add up to 5 medicines only.' });
    }

    // Check if a medicine with the same name (case-insensitive) already exists for the logged-in user
    const existingMedicine = await Medicine.findOne({
        user: req.session.userId,
        name: { $regex: new RegExp('^' + name + '$', 'i') } // Case-insensitive search
    });

    if (existingMedicine) {
        // If medicine exists, update the stock by adding the new stock to the existing stock
        existingMedicine.stock += parseInt(stock, 10); // Convert stock to integer and add to existing stock
        await existingMedicine.save();
        return res.redirect('/view-medicines'); // Redirect to view medicines after saving the updated stock
    }

    // If no existing medicine is found, add the new medicine
    const medicine = new Medicine({
        name,
        stock,
        user: req.session.userId,
        dateAdded: new Date() // Save the date and time of adding the medicine
    });

    await medicine.save();

    // Redirect to the view medicines page
    res.redirect('/view-medicines');
});

// View Medicines Route
router.get('/view-medicines', checkAuth, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    // Get the search query from the URL
    const searchQuery = req.query.search || ''; // Default to empty string if no search

    // Find medicines based on search query
    const medicines = await Medicine.find({ 
        user: req.session.userId, 
        name: { $regex: searchQuery, $options: 'i' } // Case-insensitive search
    }).skip(skip).limit(limit);

    const totalMedicines = await Medicine.countDocuments({ 
        user: req.session.userId, 
        name: { $regex: searchQuery, $options: 'i' } // Count based on search query
    });

    // Pagination logic
    const totalPages = Math.ceil(totalMedicines / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.render('viewMedicines', {
        medicines,
        currentPage: page,
        totalPages,
        searchQuery,
        hasNextPage,
        hasPreviousPage
    });
});

// Edit Medicine Route (GET)
router.get('/edit-medicine/:id', checkAuth, async (req, res) => {
    const medicine = await Medicine.findById(req.params.id);
    
    if (!medicine || medicine.user.toString() !== req.session.userId.toString()) {
        return res.redirect('/view-medicines');
    }

    res.render('editMedicine', { medicine, error: null  });
});

// Edit Medicine Route (POST)
router.post('/edit-medicine/:id', checkAuth, async (req, res) => {
    const { name, stock } = req.body;

    const medicine = await Medicine.findById(req.params.id);
    
    if (!medicine || medicine.user.toString() !== req.session.userId.toString()) {
        return res.redirect('/view-medicines');
    }

    // Update the medicine's name and stock
    medicine.name = name;
    medicine.stock = stock;  // Update the stock value
    
    await medicine.save();

    // Redirect to the view medicines page
    res.redirect('/view-medicines');
});

// Delete Medicine Route
router.get('/delete-medicine/:id', checkAuth, async (req, res) => {
    const medicine = await Medicine.findById(req.params.id);
    
    if (!medicine || medicine.user.toString() !== req.session.userId.toString()) {
        return res.redirect('/view-medicines',error);
    }

    await Medicine.findByIdAndDelete(req.params.id);
    res.redirect('/view-medicines');
});
// Logout Route
router.get('/logout', checkAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/dashboard'); // Redirect to dashboard on error
        }
        res.redirect('/login'); // Redirect to login page after logout
    });
});


module.exports = router;
