const jwt = require('jsonwebtoken');

const SECRET_KEY = 'your_super_secret_key_change_this_in_production';

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    // Bearer <token>
    const tokenPart = token.split(' ')[1];

    if (!tokenPart) {
        return res.status(403).json({ message: 'Malformed token' });
    }

    jwt.verify(tokenPart, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.userId = decoded.id;
        next();
    });
};

const softVerifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return next();

    const tokenPart = token.split(' ')[1];
    if (!tokenPart) return next();

    jwt.verify(tokenPart, SECRET_KEY, (err, decoded) => {
        if (!err) {
            req.userId = decoded.id;
        }
        next();
    });
};

module.exports = { verifyToken, softVerifyToken, SECRET_KEY };
