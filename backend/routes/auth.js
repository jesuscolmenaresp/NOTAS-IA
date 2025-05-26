const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const dbUsers = require('../models/users');

// Página de registro
router.get('/register', (req, res) => {
    res.render('register');
});

// Procesar registro
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Validaciones básicas
    if (!name || !email || !password) {
        return res.send('Todos los campos son obligatorios');
    }

    const userExists = await dbUsers.getUserByEmail(email);
    if (userExists) {
        return res.send('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await dbUsers.insertUser(name, email, hashedPassword);

    res.redirect('/login');
});

// Página de login
router.get('/login', (req, res) => {
    res.render('login');
});

// Procesar login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await dbUsers.getUserByEmail(email);
    if (!user) {
        return res.send('Usuario no encontrado');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.send('Contraseña incorrecta');
    }

    // Guardamos el id del usuario en la sesión
    req.session.userId = user.id;
    res.redirect('/dashboard');
});

// Cerrar sesión
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Middleware para proteger rutas
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

// Página principal privada (Dashboard)
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard');
});



module.exports = router;
