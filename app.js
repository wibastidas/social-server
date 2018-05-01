// Archivo para Crear el servidor web con NodeJS, contine la configuracion de express

// Utilizar nuevas funcionalidades del Ecmascript 6
'use strict'

// Cargamos los módulos de express y body-parser
var express = require('express');
var bodyParser = require('body-parser');

// Llamamos a express para poder crear el servidor
var app = express();

// Importamos las rutas
var user_routes = require('./routes/user'); 
var follow_routes  = require('./routes/follows');
var publication_routes = require('./routes/publication');
var message_routes = require('./routes/message');


//cargar middlewares
//un metodo que se ejecuta antes que llegue a un controlador
//Configuramos bodyParser para que convierta el body de nuestras peticiones a JSON
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//cors
// configurar cabeceras http
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
 
    next();
});

// Cargamos las rutas
app.use('/api', user_routes);
app.use('/api', follow_routes);
app.use('/api', publication_routes);
app.use('/api', message_routes);


// exportamos este módulo para poder usar la variable app fuera de este archivo
module.exports = app;