'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');

function probando(req, res){
    res.status(200).send({
        message: "hola desde controlador de publicaicones"
    });
}

//guardar una publicacion
function savePublication(req, res){
    var params = req.body;

    //lo comento para permitir enviar publicaciones solo con imagen
    /*if(!params.text){
        return res.status(200).send({message: 'debes enviar un texto'});
    }*/

    var publication = new Publication();

    publication.text = params.text;
    publication.file = 'null';
    publication.user = req.user.sub;
    publication.created_at = moment().unix();

    publication.save((err, publicationStore) => {
        if (err) return res.status(500).send({message: 'Error al guardar la publicacion'});

        if (!publicationStore) return res.status(404).send({message: 'La publicacion no ha sido guardada'});
    
        return res.status(200).send({publication: publicationStore});
    });

}

//devuelve todas las publicaciones de los usuarios que estamos siguiendo
function getPublications(req, res){
    var page = 1;

    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 5;

    Follow.find({user: req.user.sub}).populate('followed').exec((err, follows) => {
        if (err) return res.status(500).send({message: 'Error al devolver el seguimiento'});

        var follows_clean = [];

        follows.forEach((follow) => {
            follows_clean.push(follow.followed);
        });

        follows_clean.push(req.user.sub);

        Publication.find({user:{"$in": follows_clean} }).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
            if (err) return res.status(500).send({message: 'Error al devolver publicaciones'});

            if (!publications) return res.status(404).send({message: 'No hay publicaciones'});

            return res.status(200).send({
                total_items: total, 
                pages: Math.ceil(total/itemsPerPage),
                page: page,
                items_Per_Page: itemsPerPage,
                publications
            })


        });

    });
}


//devuelve todas las publicaciones de un usuario
function getPublicationsUser(req, res){
    var page = 1;

    if(req.params.page){
        page = req.params.page;
    }

    var user = req.user.sub;

    if(req.params.user){
        user = req.params.user;
    }

    var itemsPerPage = 5;

    Publication.find({user: user}).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
        if (err) return res.status(500).send({message: 'Error al devolver publicaciones'});

        if (!publications) return res.status(404).send({message: 'No hay publicaciones'});

        return res.status(200).send({
            total_items: total, 
            pages: Math.ceil(total/itemsPerPage),
            page: page,
            items_Per_Page: itemsPerPage,
            publications
        })


    });

}

//devuelve una publicacion en base a su id
function getPublication(req, res){
    var publicationId = req.params.id;

    Publication.findById(publicationId, (err, publication) => {
        if (err) return res.status(500).send({message: 'Error al devolver la publicacion'});

        if (!publication) return res.status(404).send({message: 'No existe la  publicacione'});

        return res.status(200).send({publication});
    });
}

//elimina una publicacion
function deletePublication(req, res){
    var publicationId = req.params.id;

    /*Publication.find({'user': req.user.sub, '_id':publicationId}).remove((err, publicationRemove) => {
        if (err) return res.status(500).send({message: 'Error al borrar la publicacion'});

        if (!publicationRemove) return res.status(404).send({message: 'No se ha borrado la publicacion'});

        return res.status(200).send({publication: publicationRemove});
    });*/

    Publication.findOneAndRemove({'user': req.user.sub, '_id': publicationId},(err, publicationRemoved) => {
        if(err) return res.status(500).send({message: 'Error al borrar publicación'});

        return res.status(200).send({message: 'Publicación eliminada correctamente'});
    });
}

//subir imagen en una publicacion
function uploadImage(req, res){
    var publicationId = req.params.id;
    
    if(req.files){
        var file_path = req.files.image.path;
        var file_split = file_path.split('\/');
        var file_name = file_split[2];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){

            Publication.findOne({'user':req.user.sub, '_id':publicationId}).exec((err, publication) => {

                if(publication){
                    //actualizar documento de la publicacion
                    Publication.findByIdAndUpdate(publicationId, {file: file_name}, {new: true},(err, publicationUpdated) => {
                        if(err)return res.status(500).send({message: 'Error en la petición'});
                
                        if(!publicationUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
                
                        return res.status(200).send({publication: publicationUpdated});
                    });
                } else {
                    return removeFilesOfUpoload(res, file_path, 'No tienes permiso para actualizar esta publicación');
                }
            });

        }else{
            return removeFilesOfUpoload(res, file_path, 'Extensión no válida');
        }
    
    } else {
        return res.status(200).send({message: 'No se han subido imagenes'});
    }
}

function removeFilesOfUpoload(res, file_path, message){
    console.log('removeFilesOfUpoload');
    fs.unlink(file_path, (err) => {
        return res.status(202).send({message: message});
        
    });
}

//obtener imagen de una publicacion
function getImageFile(req, res){
    var image_file = req.params.imageFile;
    var path_file = './uploads/publications/'+image_file;

    fs.exists(path_file, (exists) => {
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            return res.status(200).send({message: 'No existe la imagen'});
        }
    });
}  



module.exports = {
    probando, 
    savePublication, 
    getPublications, 
    getPublication, 
    deletePublication, 
    uploadImage, 
    getImageFile, 
    getPublicationsUser
}