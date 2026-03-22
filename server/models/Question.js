const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    options: {
        type: [String],
        required: true,
        validate: [v => v.length >= 2, 'Must have at least two options']
    },
    correctAnswer: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('question', QuestionSchema);