const API_URL = '/api';
const app = document.getElementById('app');
const navbar = document.getElementById('navbar');

// State
let currentUser = JSON.parse(localStorage.getItem('user'));
let token = localStorage.getItem('token');

// Headers
const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

// Utils
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
};

// Views
const renderLogin = () => {
    navbar.classList.add('hidden');
    app.innerHTML = `
        <div class="auth-container">
            <h2>Login</h2>
            <form id="login-form">
                <div class="form-group">
                    <label>Username or Email</label>
                    <input type="text" id="login-username" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="login-password" required>
                </div>
                <button type="submit" class="btn">Login</button>
            </form>
            <div class="switch-auth">
                Don't have an account? <a id="link-register">Register</a>
            </div>
        </div>
    `;

    document.getElementById('link-register').onclick = renderRegister;
    document.getElementById('login-form').onsubmit = handleLogin;
};

const renderRegister = () => {
    navbar.classList.add('hidden');
    app.innerHTML = `
        <div class="auth-container">
            <h2>Register</h2>
            <form id="register-form">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="reg-username" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="reg-email" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="reg-password" required>
                </div>
                <button type="submit" class="btn">Register</button>
            </form>
            <div class="switch-auth">
                Already have an account? <a id="link-login">Login</a>
            </div>
        </div>
    `;

    document.getElementById('link-login').onclick = renderLogin;
    document.getElementById('register-form').onsubmit = handleRegister;
};

const renderFeed = async () => {
    if (!token) return renderLogin();
    navbar.classList.remove('hidden');
    
    app.innerHTML = `
        <div class="create-post">
            <div class="form-group">
                <textarea id="post-content" placeholder="What's on your mind, ${currentUser.username}?"></textarea>
            </div>
            <button id="btn-create-post" class="btn">Post</button>
        </div>
        <div id="posts-container">
            Loading posts...
        </div>
    `;

    document.getElementById('btn-create-post').onclick = handleCreatePost;
    loadPosts();
};

const renderProfile = async (username) => {
    navbar.classList.remove('hidden');
    app.innerHTML = '<div style="text-align:center; margin-top: 50px;">Loading profile...</div>';

    try {
        const res = await fetch(`${API_URL}/users/${username}`, { headers: getHeaders() });
        const data = await res.json();

        if (res.status !== 200) {
            app.innerHTML = `<div style="text-align:center; margin-top: 50px;">${data.message}</div>`;
            return;
        }

        const isMe = currentUser && currentUser.username === data.username;
        const followBtnText = data.isFollowing ? 'Unfollow' : 'Follow';
        const followBtnClass = data.isFollowing ? 'btn follow-btn following' : 'btn follow-btn';
        
        const followButtonHtml = !isMe && token ? 
            `<button id="btn-follow" class="${followBtnClass}" data-username="${data.username}">${followBtnText}</button>` : '';

        app.innerHTML = `
            <div class="profile-header">
                <img src="${data.profilePic}" alt="Profile" class="profile-avatar">
                <div class="profile-info">
                    <h2>${data.username}</h2>
                    <p>${data.bio || 'No bio yet.'}</p>
                    <div class="profile-stats">
                        <div class="stat-item"><strong>${data.posts.length}</strong> Posts</div>
                        <div class="stat-item"><strong>${data.followersCount}</strong> Followers</div>
                        <div class="stat-item"><strong>${data.followingCount}</strong> Following</div>
                    </div>
                    ${followButtonHtml}
                </div>
            </div>
            <div id="profile-posts">
                <!-- Posts will be reused here -->
            </div>
        `;

        if (document.getElementById('btn-follow')) {
            document.getElementById('btn-follow').onclick = () => handleFollow(data.username);
        }

        const postsContainer = document.getElementById('profile-posts');
        if (data.posts.length === 0) {
            postsContainer.innerHTML = '<p style="text-align:center; color:#65676b;">No posts yet.</p>';
        } else {
            // Re-render posts manually or refactor renderPost to be reusable
            // Since data.posts here might lack author info if the API structure differs, let's check.
            // The userController returns 'userPosts' which are raw posts.
            // We need to inject the author info since it's the profile owner.
            data.posts.forEach(post => {
                post.author = { username: data.username, profilePic: data.profilePic };
                // Also need comment count if not provided by profile API
                // The profile API didn't enrich posts with comment counts. 
                // For simplicity, we might show 0 comments or fetch them. 
                // Let's just render what we have.
                postsContainer.innerHTML += createPostHTML(post);
            });
            // Attach event listeners for the new posts
            attachPostListeners();
        }

    } catch (err) {
        console.error(err);
        app.innerHTML = '<div style="text-align:center; margin-top: 50px;">Error loading profile.</div>';
    }
};

// Handlers
const handleRegister = async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Registration successful! Please login.');
            renderLogin();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error registering');
    }
};

const handleLogin = async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            token = data.token;
            currentUser = data.user;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(currentUser));
            renderFeed();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error logging in');
    }
};

const handleCreatePost = async () => {
    const content = document.getElementById('post-content').value;
    if (!content.trim()) return;

    try {
        const res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ content })
        });
        if (res.ok) {
            loadPosts(); // Reload feed
        } else {
            alert('Failed to create post');
        }
    } catch (err) {
        console.error(err);
    }
};

const loadPosts = async () => {
    const container = document.getElementById('posts-container');
    try {
        const res = await fetch(`${API_URL}/posts`, { headers: getHeaders() });
        const posts = await res.json();
        
        if (posts.length === 0) {
            container.innerHTML = '<p style="text-align:center; margin-top:20px;">No posts yet. Be the first!</p>';
            return;
        }

        container.innerHTML = posts.map(createPostHTML).join('');
        attachPostListeners();

    } catch (err) {
        container.innerHTML = 'Error loading posts.';
    }
};

const createPostHTML = (post) => {
    const isLiked = currentUser && post.likes && post.likes.includes(currentUser.id);
    const likeClass = isLiked ? 'active' : '';
    const likeCount = post.likes ? post.likes.length : 0;
    const commentCount = post.commentCount || 0;

    return `
        <div class="post" id="post-${post._id}">
            <div class="post-header">
                <img src="${post.author.profilePic || 'https://via.placeholder.com/40'}" class="avatar">
                <div>
                    <div class="username" onclick="renderProfile('${post.author.username}')">${post.author.username}</div>
                    <small style="color:#65676b; font-size:0.8rem;">${formatDate(post.createdAt)}</small>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            <div class="post-actions">
                <button class="action-btn like-btn ${likeClass}" data-id="${post._id}">
                    <span>👍</span> ${likeCount} Likes
                </button>
                <button class="action-btn comment-btn" data-id="${post._id}">
                    <span>💬</span> ${commentCount} Comments
                </button>
            </div>
            <div class="comments-section hidden" id="comments-${post._id}">
                <div class="comments-list" id="comments-list-${post._id}"></div>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <input type="text" placeholder="Write a comment..." class="comment-input" id="input-comment-${post._id}" style="flex:1; padding:8px; border-radius:20px; border:1px solid #ddd;">
                    <button class="btn" style="width:auto; padding:5px 15px;" onclick="handleComment('${post._id}')">Send</button>
                </div>
            </div>
        </div>
    `;
};

const attachPostListeners = () => {
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.onclick = (e) => handleLike(e.currentTarget.dataset.id);
    });
    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.onclick = (e) => toggleComments(e.currentTarget.dataset.id);
    });
};

const handleLike = async (postId) => {
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'PUT',
            headers: getHeaders()
        });
        if (res.ok) {
            // Ideally just update the specific post DOM, but reload for simplicity
            // Or fetch updated post
            // For now, reload feed or profile depending on where we are
            // But checking where we are is tricky. Let's just find the button and update count?
            // The API returns { likes: [] }
            const data = await res.json();
            const btn = document.querySelector(`.like-btn[data-id="${postId}"]`);
            if (btn) {
                const isLiked = data.likes.includes(currentUser.id);
                btn.classList.toggle('active', isLiked);
                btn.innerHTML = `<span>👍</span> ${data.likes.length} Likes`;
            }
        }
    } catch (err) {
        console.error(err);
    }
};

const toggleComments = async (postId) => {
    const section = document.getElementById(`comments-${postId}`);
    section.classList.toggle('hidden');
    if (!section.classList.contains('hidden')) {
        loadComments(postId);
    }
};

const loadComments = async (postId) => {
    const list = document.getElementById(`comments-list-${postId}`);
    list.innerHTML = 'Loading...';
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/comments`, { headers: getHeaders() });
        const comments = await res.json();
        
        list.innerHTML = comments.map(c => `
            <div class="comment">
                <img src="${c.author.profilePic}" class="comment-avatar">
                <div class="comment-content">
                    <div class="comment-author">${c.author.username}</div>
                    <div>${c.content}</div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = 'Error loading comments';
    }
};

const handleComment = async (postId) => {
    const input = document.getElementById(`input-comment-${postId}`);
    const content = input.value;
    if (!content.trim()) return;

    try {
        const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ content })
        });
        if (res.ok) {
            input.value = '';
            loadComments(postId);
            // Optionally update comment count on the button
        }
    } catch (err) {
        console.error(err);
    }
};

const handleFollow = async (username) => {
    try {
        const res = await fetch(`${API_URL}/users/${username}/follow`, {
            method: 'POST',
            headers: getHeaders()
        });
        if (res.ok) {
            renderProfile(username); // Reload profile to update stats and button
        }
    } catch (err) {
        console.error(err);
    }
};

// Navbar listeners
document.getElementById('nav-feed').onclick = () => renderFeed();
document.getElementById('nav-profile').onclick = () => {
    if (currentUser) renderProfile(currentUser.username);
};
document.getElementById('nav-logout').onclick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    token = null;
    currentUser = null;
    renderLogin();
};

// Init
if (token) {
    renderFeed();
} else {
    renderLogin();
}
