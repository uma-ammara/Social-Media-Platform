const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', postController.getPosts);
router.post('/', verifyToken, postController.createPost);
router.put('/:postId/like', verifyToken, postController.likePost);
router.post('/:postId/comments', verifyToken, postController.addComment);
router.get('/:postId/comments', postController.getComments);

module.exports = router;
