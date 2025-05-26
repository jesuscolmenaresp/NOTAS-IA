const express = require('express');
const router = express.Router();
const dbNotes = require('../models/notes');
const dbFiles = require('../models/files');  // 💬 Importamos el modelo de files
const path = require('path');
const fs = require('fs'); // 💬 Para manejar archivos

const multer = require('multer');        // 💬 Para manejar subida de archivos
const axios = require('axios');           // 💬 Para enviar imagen a Flask OCR
const FormData = require('form-data');    // 💬 Para construir form-data
const { Blob } = require('buffer');        // 💬 Blob para manejar archivos en Node
const PDFDocument = require('pdfkit');



// Middleware para proteger rutas
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

// Configurar multer para manejar la imagen en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Mostrar todas las notas
// Mostrar todas las notas
router.get('/notes', isAuthenticated, async (req, res) => {
    let notes = await dbNotes.getNotesByUser(req.session.userId);

    // Formatear fecha de cada nota
    notes = notes.map(note => {
        if (note.created_at) {
            const date = new Date(note.created_at);
            note.created_at_formatted = date.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } else {
            note.created_at_formatted = 'Fecha no disponible';
        }
        return note;
    });

    res.render('notes', { notes });
});


// Mostrar formulario para nueva nota
router.get('/notes/add', isAuthenticated, (req, res) => {
    res.render('add-note');
});

// Procesar nueva nota
router.post('/notes/add', isAuthenticated, async (req, res) => {
    const { title, content } = req.body;
    const createdAt = new Date().toISOString();
    await dbNotes.insertNote(req.session.userId, title, content, createdAt);
    res.redirect('/notes');
});

// Mostrar formulario para subir imagen
router.get('/notes/upload', isAuthenticated, (req, res) => {
    res.render('upload-image');  // este archivo ejs debes crearlo
});

// Procesar imagen subida
router.post('/notes/upload', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const imageBuffer = req.file.buffer;

        const FormData = require('form-data');

        // Dentro de tu ruta POST /notes/upload
        const formData = new FormData();
        formData.append('image', req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        });
        
        const response = await axios.post('http://localhost:5000/ocr', formData, {
          headers: formData.getHeaders(),
        });
        

        const extractedText = response.data.text || 'Texto no detectado';

        const createdAt = new Date().toISOString();
        await dbNotes.insertNote(req.session.userId, 'Nota OCR', extractedText, createdAt);

        res.redirect('/notes');
    } catch (error) {
        console.error(error);
        res.send('Error al procesar la imagen.');
    }
});

// Descargar nota como PDF
// Descargar nota como PDF
router.get('/notes/:id/download', isAuthenticated, async (req, res) => {
    const noteId = req.params.id;
    const notes = await dbNotes.getNotesByUser(req.session.userId);
    const note = notes.find(n => n.id == noteId);

    if (!note) {
        return res.status(404).send('Nota no encontrada.');
    }

    const doc = new PDFDocument();
    const nombreArchivo = `nota-${noteId}-${Date.now()}.pdf`;

    const relativePath = `pdfs/${nombreArchivo}`; // 👈 Ruta relativa para guardar en la BD
    const absolutePath = path.join(__dirname, '..', 'public', 'pdfs', nombreArchivo); // 👈 Ruta física real

    // Guardar el PDF físicamente
    doc.pipe(fs.createWriteStream(absolutePath));

    doc.fontSize(20).text(note.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(note.content, { align: 'left' });
    doc.end();

    // Insertar registro en la base de datos tabla `files`
    await dbFiles.insertFile(noteId, relativePath);

    // Ahora descargar el PDF para el usuario
    res.download(absolutePath);
});
// Descargar nota como PDF
router.get('/notes/:id/download', isAuthenticated, async (req, res) => {
    const noteId = req.params.id;
    const notes = await dbNotes.getNotesByUser(req.session.userId);
    const note = notes.find(n => n.id == noteId);

    if (!note) {
        return res.status(404).send('Nota no encontrada.');
    }

    const doc = new PDFDocument();
    const nombreArchivo = `nota-${noteId}-${Date.now()}.pdf`;

    const relativePath = `pdfs/${nombreArchivo}`; // Ruta relativa
    const absolutePath = path.join(__dirname, '..', 'public', 'pdfs', nombreArchivo); // Ruta física

    const stream = fs.createWriteStream(absolutePath);
    doc.pipe(stream);

    doc.fontSize(20).text(note.title, { align: 'center' });
    doc.moveDown();
    
    // ⚡ Solución para limpiar los caracteres raros
    const cleanContent = Buffer.from(note.content, 'utf8').toString('utf8');
    
    doc.fontSize(14).text(cleanContent, {
        align: 'justify',
        width: 450
    });
    doc.end();
    

    // 👉 Ahora esperamos a que el archivo realmente termine de crearse
    stream.on('finish', async () => {
        await dbFiles.insertFile(noteId, relativePath); // 👈 Insertar en la base de datos
        res.download(absolutePath);                     // 👈 Descargar al usuario
    });
});



// Mostrar formulario para editar nota
router.get('/notes/:id/edit', isAuthenticated, async (req, res) => {
    const noteId = req.params.id;
    const notes = await dbNotes.getNotesByUser(req.session.userId);
    const note = notes.find(n => n.id == noteId);

    if (!note) {
        return res.status(404).send('Nota no encontrada.');
    }

    res.render('edit-note', { note });
});

// Procesar edición de nota
router.post('/notes/:id/edit', isAuthenticated, async (req, res) => {
    const noteId = req.params.id;
    const { title, content } = req.body;

    await dbNotes.updateNote(title, content, noteId);

    res.redirect('/notes');
});

// Eliminar una nota
router.post('/notes/:id/delete', isAuthenticated, async (req, res) => {
    const noteId = req.params.id;

    await dbNotes.deleteNote(noteId);

    res.redirect('/notes');
});



module.exports = router;
