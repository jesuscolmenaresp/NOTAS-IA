const db = require('../config/database');

let queries = {
    getFilesByUser: `
        SELECT files.id, files.file_path, files.created_at
        FROM files
        JOIN notes ON files.note_id = notes.id
        WHERE notes.user_id = ?
        ORDER BY files.created_at DESC
    `,
    getFileById: 'SELECT * FROM files WHERE id = ?',
    insertFile: 'INSERT INTO files (note_id, file_path) VALUES (?, ?)',
    deleteFile: 'DELETE FROM files WHERE id = ?'
};

module.exports = {
    getFilesByUser(userId) {
        return new Promise((resolve, reject) => {
            db.all(queries.getFilesByUser, [userId], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    },

    getFileById(fileId) {
        return new Promise((resolve, reject) => {
            db.get(queries.getFileById, [fileId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    },

    insertFile(noteId, filePath) {
        return new Promise((resolve, reject) => {
            db.run(queries.insertFile, [noteId, filePath], function (err) {
                if (err) reject(err);
                resolve(this.lastID);
            });
        });
    },

    deleteFile(fileId) {
        return new Promise((resolve, reject) => {
            db.run(queries.deleteFile, [fileId], function (err) {
                if (err) reject(err);
                resolve();
            });
        });
    }
};
