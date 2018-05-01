//Archivo para conectar NodeJS con MongoDB (conexión a la base de datos)

// Utilizar nuevas funcionalidades del Ecmascript 6
'use strict'


// Cargamos el módulo de mongoose para poder conectarnos a MongoDB
var mongoose = require('mongoose');

// *Cargamos el fichero app.js con la configuración de Express
var app = require('./app');

// Creamos la variable PORT para indicar el puerto en el que va a funcionar el servidor
var port = process.env.PORT || 3800;

// Le indicamos a Mongoose que haremos la conexión con Promesas
mongoose.Promise = global.Promise;
 
// Usamos el método connect para conectarnos a nuestra base de datos
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/curso_mean_social',  { useMongoClient: true})
    .then(() => {
        // Cuando se realiza la conexión, lanzamos este mensaje por consola
        console.log("La conexión a la base de datos curso_mean_social se ha realizado correctamente")
    
        // CREAR EL SERVIDOR WEB CON NODEJS
        app.listen(port, () => {
            console.log("servidor corriendo en http://192.168.1.47:3800");
        });
    })
    // Si no se conecta correctamente mostramos el error
    .catch(err => console.log(err));