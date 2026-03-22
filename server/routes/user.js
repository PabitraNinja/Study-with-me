const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const { auth } = require('../middleware/auth');

// @route   GET api/user/performance
// @desc    Get current user's performance results
// @access  Private
router.get('/performance', auth, async (req, res) => {
    try {
        const results = await Result.find({ userId: req.user.id }).sort({ date: -1 });
        
        // Map to match the frontend expectations
        const formattedResults = results.map(r => ({
            examName: r.examName || 'Mock Test',
            score: r.score,
            totalMarks: r.total,
            completedAt: r.date
        }));

        res.json(formattedResults);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;