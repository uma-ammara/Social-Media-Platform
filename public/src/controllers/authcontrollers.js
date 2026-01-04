const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users } = require('../config/db');
const { SECRET_KEY } = require('../middleware/authMiddleware');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await users.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await users.insert({
            username,
            email,
            password: hashedPassword,
            bio: '',
            profilePic: 'https://via.placeholder.com/150',
            followers: [],
            following: []
        });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body; // Can be username or email

        const user = await users.findOne({ 
            $or: [{ username: username }, { email: username }] 
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });

        res.json({ token, user: { id: user._id, username: user.username, email: user.email, profilePic: user.profilePic } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
