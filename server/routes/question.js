const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { auth, adminAuth } = require('../middleware/auth');

// @route   GET api/questions
// @desc    Get all questions (User & Admin)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        // Return questions without the correctAnswer for users
        let questions;
        if (req.user.role === 'admin') {
             questions = await Question.find();
        } else {
             questions = await Question.find().select('-correctAnswer');
        }
        res.json(questions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/questions/submit
// @desc    Submit answers and calculate score
// @access  Private
router.post('/submit', auth, async (req, res) => {
    try {
        const { answers } = req.body; // Expecting { answers: { "questionId": "selectedOption" } }
        let score = 0;
        const questions = await Question.find();
        let total = questions.length;

        questions.forEach(q => {
            if (answers[q._id] === q.correctAnswer) {
                score++;
            }
        });

        res.json({ score, total });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/questions
// @desc    Add a new question
// @access  Admin
router.post('/', adminAuth, async (req, res) => {
    const { question, options, correctAnswer } = req.body;

    try {
        const newQuestion = new Question({
            question,
            options,
            correctAnswer
        });

        const savedQuestion = await newQuestion.save();
        res.json(savedQuestion);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/questions/:id
// @desc    Update a question
// @access  Admin
router.put('/:id', adminAuth, async (req, res) => {
    const { question, options, correctAnswer } = req.body;

    try {
        let q = await Question.findById(req.params.id);
        if (!q) return res.status(404).json({ msg: 'Question not found' });

        q = await Question.findByIdAndUpdate(
            req.params.id,
            { $set: { question, options, correctAnswer } },
            { new: true }
        );

        res.json(q);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/questions/:id
// @desc    Delete a question
// @access  Admin
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        let q = await Question.findById(req.params.id);
        if (!q) return res.status(404).json({ msg: 'Question not found' });

        await Question.findByIdAndRemove(req.params.id);
        res.json({ msg: 'Question removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;