const http = require('http');

const post = (path, data, token) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api' + path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(data))
            }
        };
        if (token) options.headers['Authorization'] = 'Bearer ' + token;

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });

        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
};

const get = (path, token) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api' + path,
            method: 'GET',
            headers: {}
        };
        if (token) options.headers['Authorization'] = 'Bearer ' + token;

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });

        req.on('error', reject);
        req.end();
    });
};

async function test() {
    try {
        console.log('1. Registering user...');
        const regRes = await post('/auth/register', {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });
        console.log('Register:', regRes.status, regRes.body);

        console.log('2. Logging in...');
        const loginRes = await post('/auth/login', {
            username: 'testuser',
            password: 'password123'
        });
        console.log('Login:', loginRes.status);
        const token = loginRes.body.token;

        if (!token) throw new Error('No token received');

        console.log('3. Creating post...');
        const postRes = await post('/posts', {
            content: 'Hello World!'
        }, token);
        console.log('Create Post:', postRes.status, postRes.body);

        console.log('4. Getting posts...');
        const postsRes = await get('/posts');
        console.log('Get Posts:', postsRes.status, 'Count:', postsRes.body.length);

        console.log('5. Getting profile...');
        const profileRes = await get('/users/testuser', token);
        console.log('Get Profile:', profileRes.status, profileRes.body.username);

        console.log('Test Complete!');
    } catch (err) {
        console.error('Test Failed:', err);
    }
}

test();
