const Datastore = require('nedb-promises');
const path = require('path');

const createDb = (name) => {
    return Datastore.create({
        filename: path.join(__dirname, `../../data/${name}.db`),
        autoload: true,
        timestampData: true
    });
};

const users = createDb('users');
const posts = createDb('posts');
const comments = createDb('comments');

// Ensure unique constraints
users.ensureIndex({ fieldName: 'username', unique: true });
users.ensureIndex({ fieldName: 'email', unique: true });

module.exports = {
    users,
    posts,
    comments
};
