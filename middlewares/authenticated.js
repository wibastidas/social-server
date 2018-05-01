//Con este meddleware comprobamos que el token enviado en una peticion sea correcto

'user strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_curso_mean';

//Metodo que vamos a usar como middleware ensureAuth
// Next sera la funcionalidad que nos va a permitir saltar a otra parte. Hasta que no lancemos el metodo next el programa no va a salir del meddleware
// Cuando ejecutemos el metodo next nodejs va a entender que debe ejecuar lo siguiente que tenga encolado en este caso seria el metodo de la ruta 
exports.ensureAuth = function(req, res, next){
    if(!req.headers.authorization){
        return res.status(403).send({message: 'La peticion no tiene la cabecera de autenticación'});
    } else {
        //La expresion regular elimina las comillas dobles y simples que pueda tener el string
        var token = req.headers.authorization.replace(/['"]+/g, '');

        //console.log("token", token); 

        try{
            //El payload es el objeto completo con todos los datos del usuario
            var payload = jwt.decode(token, secret);

            //si tiene una fecha menor o igual a la fecha actual ha expirado el token
            if(payload.exp > moment().unix()){
                return res.status(401).send({
                    message: 'EL token ha expirado'
                });
            }
        } catch (ex){
            return res.status(404).send({
                message: 'EL token no es valido'
            });
        }

        //adjuntamos el payload a la request para tener dentro de los controladores los datos del usuario logeado
        req.user = payload;

        //llamar a lo siguiente en este caso ejecutar la accion del controllador
        next();
    }
}
