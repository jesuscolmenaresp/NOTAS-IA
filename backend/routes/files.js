const express = require('express');
const router = express.Router();
const dbFiles = require('../models/files');
const path = require('path');
const fs = require('fs');

// Middleware para proteger rutas
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/login');
}

// Ver todos los PDFs
router.get('/files', isAuthenticated, async (req, res) => {
  const files = await dbFiles.getFilesByUser(req.session.userId);
  res.render('files', { files });
});

// Descargar un PDF
router.get('/files/:id/download', isAuthenticated, async (req, res) => {
  const fileId = req.params.id;
  const file = await dbFiles.getFileById(fileId);

  if (!file) {
    return res.status(404).send('Archivo no encontrado');
  }

  const filePath = path.join(__dirname, '..', 'public', file.file_path);  // ✅
  res.download(filePath);
});

// Eliminar un PDF
router.post('/files/:id/delete', isAuthenticated, async (req, res) => {
  const fileId = req.params.id;
  const file = await dbFiles.getFileById(fileId);

  if (!file) {
    return res.status(404).send('Archivo no encontrado');
  }

  const filePath = path.join(__dirname, '..', 'public', file.file_path);  // ✅

  // Elimina el archivo físico
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Elimina el registro en la base de datos
  await dbFiles.deleteFile(fileId);

  res.redirect('/files');
});

module.exports = router;
