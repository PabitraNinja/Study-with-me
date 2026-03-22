const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');

// @route   GET api/exams
// @desc    Get all exam shifts
// @access  Public
router.get('/', async (req, res) => {
    try {
        const exams = await Exam.find().sort({ date: -1 });
        res.json(exams);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;