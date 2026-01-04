const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, softVerifyToken } = require('../middleware/authMiddleware');

router.get('/:username', softVerifyToken, userController.getUserProfile);
router.post('/:username/follow', verifyToken, userController.followUser);

module.exports = router;
