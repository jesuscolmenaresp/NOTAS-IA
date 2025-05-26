const db = require('../config/database');

let queries = {
    getNotesByUser: 'SELECT * FROM notes WHERE user_id = ?',
    getNoteById: 'SELECT * FROM notes WHERE id = ?',
    insertNote: 'INSERT INTO notes (user_id, title, content, created_at) VALUES (?, ?, ?, ?)',
    updateNote: 'UPDATE notes SET title = ?, content = ?, last_modified = CURRENT_TIMESTAMP WHERE id = ?',
    deleteNote: 'DELETE FROM notes WHERE id = ?'
};

module.exports = {
    getNotesByUser(userId) {
        return new Promise((resolve, reject) => {
            db.all(queries.getNotesByUser, [userId], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    },

    getNoteById(noteId) {
        return new Promise((resolve, reject) => {
            db.get(queries.getNoteById, [noteId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    },

    insertNote(userId, title, content, createdAt) {
        return new Promise((resolve, reject) => {
            db.run(queries.insertNote, [userId, title, content, createdAt], function (err) {
                if (err) reject(err);
                resolve(this.lastID);
            });
        });
    },

    updateNote(title, content, noteId) {
        return new Promise((resolve, reject) => {
            db.run(queries.updateNote, [title, content, noteId], function (err) {
                if (err) reject(err);
                resolve();
            });
        });
    },

    deleteNote(noteId) {
        return new Promise((resolve, reject) => {
            db.run(queries.deleteNote, [noteId], function (err) {
                if (err) reject(err);
                resolve();
            });
        });
    }
};
