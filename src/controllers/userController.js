const { users, posts } = require('../config/db');

exports.getUserProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await users.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get user's posts
        const userPosts = await posts.find({ userId: user._id }).sort({ createdAt: -1 });

        // Check if current user is following this user (if logged in)
        let isFollowing = false;
        if (req.userId) { // Passed from optional auth middleware or we need strict auth?
            // Wait, we need to know who is requesting to check 'isFollowing'
            // I'll assume the token is optional for viewing but required for checking 'isFollowing' state properly
            // But usually profile is public.
            // Let's check if req.userId is present (middleware might not populate it if not enforced)
            // Actually I'll make the route optional auth or just check if token exists in frontend.
            // But for now, let's assume the frontend sends token if available.
            // The route handler in routes/userRoutes.js should probably use a "tryVerifyToken" or just standard verifyToken if we want to enforce login to view profiles? 
            // User requirements: "Profile Page... Display user info... Follow/Unfollow button (if viewing another user)".
            // Usually requires login to follow.
            
            // I'll assume req.userId is available if the user is logged in. 
            // I will use a middleware that doesn't error if no token, just proceeds.
            
             if (req.userId && req.userId !== user._id) {
                 const currentUser = await users.findOne({ _id: req.userId });
                 if (currentUser && currentUser.following.includes(user._id)) {
                     isFollowing = true;
                 }
             }
        }

        const profileData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            bio: user.bio,
            profilePic: user.profilePic,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            posts: userPosts,
            isFollowing
        };

        res.json(profileData);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.followUser = async (req, res) => {
    try {
        const { username } = req.params;
        const targetUser = await users.findOne({ username });

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (targetUser._id === req.userId) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }

        const currentUser = await users.findOne({ _id: req.userId });

        const isFollowing = currentUser.following.includes(targetUser._id);

        if (isFollowing) {
            // Unfollow
            await users.update({ _id: req.userId }, { $pull: { following: targetUser._id } });
            await users.update({ _id: targetUser._id }, { $pull: { followers: req.userId } });
        } else {
            // Follow
            await users.update({ _id: req.userId }, { $push: { following: targetUser._id } });
            await users.update({ _id: targetUser._id }, { $push: { followers: req.userId } });
        }

        // Return updated counts
        const updatedTargetUser = await users.findOne({ _id: targetUser._id });
        const updatedCurrentUser = await users.findOne({ _id: req.userId }); // to update local state if needed

        res.json({ 
            isFollowing: !isFollowing, 
            followersCount: updatedTargetUser.followers.length 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
