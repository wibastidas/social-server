'use strict'

// Cargamos el módulo de express para poder crear rutas
var express = require('express');

// Cargamos el controlador
var UserController = require('../controllers/user');

// Llamamos al router
var api = express.Router();

var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/users'});

// Creamos una ruta para los métodos que tenemos en nuestros controladores
api.get('/home', UserController.home);
api.get('/pruebas', md_auth.ensureAuth, UserController.pruebas);
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
api.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers);
api.get('/counters/:id?', md_auth.ensureAuth, UserController.getCounters);
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser);
api.post('/upload-image-user/:id', [md_auth.ensureAuth, md_upload], UserController.uploadImage);
api.get('/get-image-user/:imageFile?', UserController.getImageFile);

// Exportamos la configuración
module.exports = api;  