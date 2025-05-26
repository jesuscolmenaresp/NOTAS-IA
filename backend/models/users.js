const db = require('../config/database');

let queries = {
    getUsers: 'SELECT * FROM users',
    getUserByEmail: 'SELECT * FROM users WHERE email = ?',
    insertUser: 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
};

module.exports = {
    getUsers() {
        return new Promise((resolve, reject) => {
            db.all(queries.getUsers, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    },

    getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            db.get(queries.getUserByEmail, [email], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    },

    insertUser(name, email, password) {
        return new Promise((resolve, reject) => {
            db.run(queries.insertUser, [name, email, password], function (err) {
                if (err) reject(err);
                resolve(this.lastID);
            });
        });
    }
};
