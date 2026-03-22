const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

// @route   POST api/result
// @desc    Save a test result
// @access  Private
router.post('/', auth, async (req, res) => {
    const { score, total, examName } = req.body;

    try {
        const newResult = new Result({
            userId: req.user.id,
            score,
            total,
            examName: examName || 'Mock Test'
        });

        const savedResult = await newResult.save();
        res.json(savedResult);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/result/:userId
// @desc    Get results for a specific user
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        const results = await Result.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/result
// @desc    Get all results (Admin only)
// @access  Admin
router.get('/', adminAuth, async (req, res) => {
    try {
        const results = await Result.find().populate('userId', ['name', 'email']).sort({ date: -1 });
        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;