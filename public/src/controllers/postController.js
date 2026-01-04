const { posts, users, comments } = require('../config/db');

exports.createPost = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        const newPost = await posts.insert({
            userId: req.userId,
            content,
            likes: [],
            createdAt: new Date()
        });

        // Fetch author details to return with post
        const author = await users.findOne({ _id: req.userId });
        
        res.status(201).json({ 
            ...newPost, 
            author: { username: author.username, profilePic: author.profilePic } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getPosts = async (req, res) => {
    try {
        const allPosts = await posts.find({}).sort({ createdAt: -1 });
        
        // Enrich posts with author info and comment counts
        const enrichedPosts = await Promise.all(allPosts.map(async (post) => {
            const author = await users.findOne({ _id: post.userId });
            const commentCount = await comments.count({ postId: post._id });
            return {
                ...post,
                author: author ? { username: author.username, profilePic: author.profilePic, _id: author._id } : { username: 'Unknown' },
                commentCount
            };
        }));

        res.json(enrichedPosts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await posts.findOne({ _id: postId });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const userId = req.userId;
        const isLiked = post.likes.includes(userId);

        if (isLiked) {
            // Unlike
            await posts.update({ _id: postId }, { $pull: { likes: userId } });
        } else {
            // Like
            await posts.update({ _id: postId }, { $push: { likes: userId } });
        }

        const updatedPost = await posts.findOne({ _id: postId });
        res.json({ likes: updatedPost.likes });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        const newComment = await comments.insert({
            postId,
            userId: req.userId,
            content,
            createdAt: new Date()
        });

        const author = await users.findOne({ _id: req.userId });

        res.status(201).json({
            ...newComment,
            author: { username: author.username, profilePic: author.profilePic }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const postComments = await comments.find({ postId }).sort({ createdAt: 1 });

        const enrichedComments = await Promise.all(postComments.map(async (comment) => {
            const author = await users.findOne({ _id: comment.userId });
            return {
                ...comment,
                author: author ? { username: author.username, profilePic: author.profilePic } : { username: 'Unknown' }
            };
        }));

        res.json(enrichedComments);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
