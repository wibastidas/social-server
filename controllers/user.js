'use strict'

var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');

// Cargamos los modelos para usarlos posteriormente
var User = require('../models/user');
var Follow = require('../models/follow');
var jwt = require('../services/jwt')
var Publication = require('../models/publication');

//Creamos un método en el controlador, en este caso una accion de pruebas
function home(req, res){
    // Devolvemos una respuesta en JSON
    res.status(200).send({
        message: "Hola mundo"
    });
}

//Creamos un método en el controlador, en este caso una accion de pruebas
function pruebas(req, res) {
    res.status(200).send({
        message: "Acción de pruebas en el servidor nodejs"
    });
}

//Registro de un usuario
function saveUser(req, res){
    var params = req.body;
    var user = new User();

    if(params.name && params.surname && 
       params.nick && params.email && params.password){
            user.name = params.name;
            user.surname = params.surname;
            user.nick = params.nick;
            user.email = params.email;
            user.role = 'ROLE_USER';
            user.image = null;

            //Controlar usuarios duplicados
            User.findOne({ $or: [
                {email: user.email.toLowerCase()},
                {nick: user.nick.toLowerCase()}
            ]}).exec((err, users) => {
                if(err) return res.status(500).send({message: 'Error en la peticion de usuarios'});
                //console.log('users:', users);
                //console.log('typeof(users)', typeof(users));
                //if(users && users.length >= 1){
                //Me daba error undefined el .length
                if(users){
                    //console.log('ya hay usuario');
                    return res.status(200).send({message: 'El usuario que intenta registrar ya existe' });
                } else {
                    //Ciframos la password y guardamos los datos
                    bcrypt.hash(params.password, null, null, (err, hash) => {
                        user.password = hash;
                        user.save((err, userStore) => {
                            if(err) return res.status(500).send({message: 'Error al guardar el usuario'});
                    
                            if(userStore){
                                res.status(200).send({user: userStore});
                            } else {
                                res.status(404).send({message: 'No se ha registrado el usuario'});
                            }
                        });
                    });
                }
            });
                

       } else {
           res.status(200).send({
               message: 'Envia todos los campos necesarios!'
           });
       }
}

// Login de un usuario. Devuelve un token de autenticacion
function loginUser(req, res){
    var params = req.body;

    var email = params.email;
    var password = params.password;

    User.findOne({email: email}, (err, user) => {
        if(err) return res.status(500).send({message: 'Error en la peticion'});

        if(user){
            bcrypt.compare(password, user.password, (err, check) => {
                if(check) {
                    //devolver datos de usuario
                    if(params.gettoken){
                        //generar y devolver token
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    }else{
                        user.password = undefined;
                        return res.status(200).send({user});
                    }
                } else {
                    return res.status(404).send({message: 'El usuario no se ha podido identificar'});
                }
            });
        } else {
            return res.status(404).send({message: 'El usuario no se ha podido identificar!!!'});
        }
    });
}

// Conseguir datos de un usuario por su id y el token devuelto por el login
function getUser(req, res){
    var userId = req.params.id;

    //buscar un documento por un  id
    User.findById(userId, (err, user) => {
        if(err)return res.status(500).send({message: 'Error en la petición'});

        if(!user) return res.status(404).send({message: 'EL usuario no existe'});

        
        followThisUser(req.user.sub, userId).then((value) => {
            user.password = undefined;
            return res.status(200).send({
                user,
                following: value.following,
                followed: value.followed
            });
        });
        
    });
}

//compruebo si el usuario que estoy intentando obtener me sigue y lo sigo
async function followThisUser(identity_user_id, user_id){
    try {
        var following = await Follow.findOne({ user: identity_user_id, followed: user_id}).exec()
            .then((following) => {
                //log(following);
                return following;
            })
            .catch((err)=>{
                return handleerror(err);
            });
        var followed = await Follow.findOne({ user: user_id, followed: identity_user_id}).exec()
            .then((followed) => {
                //console.log(followed);
                return followed;
            })
            .catch((err)=>{
                return handleerror(err);
            });
        return {
            following: following,
            followed: followed
        }
    } catch(e){
        console.log(e);
    }
}


//listar todos los usuarios de la plataforma paginados 
function getUsers(req, res){
    var identity_user_id = req.user.sub;
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 10;

    User.find().paginate(page, itemsPerPage,(err, users, total) => {
        if(err)return res.status(500).send({message: 'Error en la petición'});

        if(!users) return res.status(404).send({message: 'No hay usuarios disponibles'});

        followThisUserIds(identity_user_id).then((value) => {
            return res.status(200).send({
                users, 
                users_followig: value.following,
                users_follow_me: value.followed,
                total, 
                pages: Math.ceil(total/itemsPerPage)
            });
        });
    });
}

//devuelvo un array de usuarios que me siguen y los que sigos
async function followThisUserIds(user_id){
    try { 

        var following = await Follow.find({"user":user_id}).select({'_id':0, '__v':0, 'user':0}).exec() .then((follows) => {
            return follows;
        }).catch((err) => {
            return handleError(err);
        });
        
        var followed = await Follow.find({"followed":user_id}).select({'_id':0, '__v':0, 'followed':0}).exec().then((follows) => {
            return follows;
        }).catch((err) => {
            return handleError(err);
        });
                
        //Procesar following Ids
        var following_clean = [];

        following.forEach((follow) => {
            following_clean.push(follow.followed);
        });

        //Procesar followed Ids
        var followed_clean = [];

        followed.forEach((follow) => {
            followed_clean.push(follow.user);
        });   
            
        return {
            following: following_clean,
            followed: followed_clean
        }
        
    } catch(e) {
        console.log(e);
    }
}

// Devuelve la cantidad de publicaciones, seguidos y seguidores de un usuario
function getCounters(req, res){
    var userId = req.user.sub;

    if(req.params.id){
        userId = req.params.id;
    }

    getCountFollow(userId).then((value) => {
        return res.status(200).send(value);
    });
}

async function getCountFollow(user_id){
    try {
        var following = await Follow.count({"user":user_id}).exec().then(count => {
            return count;
        }).catch((err) => {
            return handleError(err);
        });
        
        var followed = await Follow.count({"followed":user_id}).exec().then(count => {
            return count;
        }).catch((err) => {
            return handleError(err);
        });

        var publications = await Publication.count({"user":user_id}).exec().then(count => {
            return count;
        }).catch((err) => {
            return handleError(err);
        });
        
        return {
            following:following,
            followed:followed, 
            publications: publications
        }
    
    } catch(e) {
        console.log(e);
    }
}

//Editar los datos de usuario
function updateUser(req, res){
    var userId = req.params.id;
    var update = req.body;

    //borrar la propiedad password
    delete update.password;

    if(userId != req.user.sub){
        return res.status(500).send({message: 'No tiene permiso para actualizar los datos del usuario'});
    } 

    User.find({ $or: [
        {email: update.email.toLowerCase()}, 
        {nick: update.nick.toLowerCase()}
    ]}).exec((err, users) => {

        var user_isset = false;

        users.forEach((user) => {
            if(user && user._id != userId) user_isset  = true; 
        });

        if(user_isset) return res.status(200).send({message: 'El nick o email ya está en uso'});

        User.findByIdAndUpdate(userId, update, {new:true}, (err, userUpdated) => {
            if(err)return res.status(500).send({message: 'Error en la petición'});
            
            if(!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
    
            userUpdated.password = undefined;
    
            return res.status(200).send({user: userUpdated});
    
        });

    });
}

//subir archivos de imagen/avatar de usuarios
function uploadImage(req, res){
    var userId = req.params.id;
    
    if(req.files){
        var file_path = req.files.image.path;
        //console.log(file_path);

        var file_split = file_path.split('\/');
        //console.log(file_split);

        var file_name = file_split[2];
        //console.log(file_name);
        
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];
        //console.log(file_ext);

        if(userId != req.user.sub){
            return removeFilesOfUpoload(res, file_path, 'No tiene permiso para actualizar los datos del usuario');
        } 

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
            //actualizar documento de usuario logeado
            User.findByIdAndUpdate(userId, {image: file_name}, {new: true},(err, userUpdated) => {
                if(err)return res.status(500).send({message: 'Error en la petición'});
        
                if(!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
        
                return res.status(200).send({user: userUpdated});
            })
        }else{
            return removeFilesOfUpoload(res, file_path, 'Extensión no válida');
        }
    
    } else {
        return res.status(200).send({message: 'No se han subido imagenes'});
    }
}

function removeFilesOfUpoload(res, file_path, message){
    fs.unlink(file_path, (err) => {
        return res.status(202).send({message: message});
        
    });
}

//Devuelve la imagen avatar  de un usuario 
function getImageFile(req, res){
    var image_file = req.params.imageFile;
    var path_file = './uploads/users/'+image_file;

    fs.exists(path_file, (exists) => {
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            return res.status(200).send({message: 'No existe la imagen'});
        }
    });
}  

// Exportamos las funciones en un objeto json para poder usarlas en otros fuera de este fichero
module.exports = {  
    home,
    pruebas, 
    saveUser, 
    loginUser, 
    getUser, 
    getUsers, 
    getCounters,
    updateUser, 
    uploadImage, 
    getImageFile
}