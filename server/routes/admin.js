const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads for PDFs
const pdfStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../../client/pdfs');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const uploadPdf = multer({ storage: pdfStorage });

// Configure multer for HTML Exam file uploads
const htmlStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../../client'); // Save right in the client folder for direct serving
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Sanitize the filename to be URL friendly, but keep the .html extension
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, cleanName);
    }
});
const uploadHtml = multer({ 
    storage: htmlStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/html' || file.originalname.endsWith('.html')) {
            cb(null, true);
        } else {
            cb(new Error('Only HTML files are allowed for Exam Shifts'));
        }
    }
});

// @route   POST api/admin/users
// @desc    Add a user
// @access  Admin
router.post('/users', adminAuth, async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: 'User email already exists' });
        
        user = await User.findOne({ username });
        if (user) return res.status(400).json({ error: 'Username already exists' });

        user = new User({
            name: username,
            username,
            email,
            password,
            role: role || 'user'
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        
        // return without password
        const userToReturn = await User.findById(user.id).select('-password');
        res.json(userToReturn);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @route   GET api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @route   PUT api/admin/users/:id/block
// @desc    Toggle block status of a user
// @access  Admin
router.put('/users/:id/block', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Prevent admin from blocking themselves
        if (user.id === req.user.id) {
             return res.status(400).json({ error: 'Cannot block yourself' });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();
        res.json({ msg: 'User block status updated', isBlocked: user.isBlocked });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @route   DELETE api/admin/users/:id
// @desc    Delete a user
// @access  Admin
router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Prevent admin from deleting themselves
        if (user.id === req.user.id) {
             return res.status(400).json({ error: 'Cannot delete yourself' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @route   GET api/admin/files
// @desc    Get all PDF files
// @access  Admin
router.get('/files', adminAuth, (req, res) => {
    const dir = path.join(__dirname, '../../client/pdfs');
    if (!fs.existsSync(dir)){
        return res.json([]);
    }
    fs.readdir(dir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Could not list files' });
        }
        res.json(files);
    });
});

// @route   POST api/admin/files
// @desc    Upload a file
// @access  Admin
router.post('/files', adminAuth, uploadPdf.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ msg: 'File uploaded successfully', filename: req.file.filename });
});

// @route   DELETE api/admin/files/:filename
// @desc    Delete a file
// @access  Admin
router.delete('/files/:filename', adminAuth, (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '../../client/pdfs', filename);
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        res.json({ msg: 'File deleted' });
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

const Exam = require('../models/Exam');

// @route   POST api/admin/exams
// @desc    Add a new exam shift link WITH HTML file upload
// @access  Admin
router.post('/exams', adminAuth, uploadHtml.single('examFile'), async (req, res) => {
    const { title, description } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ error: 'An HTML file must be provided for the exam shift.' });
    }

    try {
        const link = req.file.filename; // The safe filename generated by multer
        const newExam = new Exam({ title, description, link });
        await newExam.save();
        res.json(newExam);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @route   DELETE api/admin/exams/:id
// @desc    Delete an exam shift link
// @access  Admin
router.delete('/exams/:id', adminAuth, async (req, res) => {
    try {
        await Exam.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Exam removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;