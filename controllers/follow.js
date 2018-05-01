'use strict'

//var path = require('path');
//var fs = require('fs');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');

//seguir usuarios
function saveFollow(req, res){
    var params = req.body;

    var follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;

    if(follow.user && follow.followed){
        Follow.find({'user': follow.user, 'followed': follow.followed}, (err, followStored) => {
            if(followStored.length > 0){
                return res.status(500).send({message: 'Error en la peticion, ya existe el followed'});
            } else {
                follow.save((err, followStored) => {
                    if(err) return res.status(500).send({message: 'Error al guardar el seguimiento'});
            
                    if(!followStored) return res.status(404).send({message: 'El seguimiento no se ha guardado'});
                    
                    return res.status(200).send({follow: followStored})
                });
            }
        });
    } else {
        return res.status(500).send({message: 'Error en la peticion, falta el usr o followed'});
    }
    
}

// Dejar de seguir un  usuario por su id
function deleteFollow(req, res){
    var userId = req.user.sub;
    var followId = req.params.id;

    Follow.find({'user': userId, 'followed': followId}).remove(err => {
        if(err) return res.status(500).send({message: 'Error al dejar de seguir'});
    });

    return res.status(200).send({message: 'El follow se a eliminado!'})
}

//Lista paginada de usuarios que nos sigue
function getFollowedUsers(req, res){

    var userId = req.user.sub;

    if(req.params.id && req.params.page){
        userId = req.params.id;
    }

    var page = 1;

    if(req.params.page){
        page = req.params.page;
    } else {
        page = req.params.id;
    }

    var itemsPerPage = 10;

    Follow.find({followed:userId}).populate({path: 'user'}).paginate(page, itemsPerPage, (err, follows, total) => {
        if(err) return res.status(500).send({message: 'Error en el servidor'});

        if(!follows) return res.status(404).send({message: 'No te sigue ningun usuario'});

        followThisUserIds(req.user.sub).then((value) => {
            return res.status(200).send({
                total: total,
                pages: Math.ceil(total/itemsPerPage), 
                follows, 
                users_followig: value.following,
                users_follow_me: value.followed
            });
        });
    });
}

//Lista paginada de usuarios a los que sigo 
function getFollowingUsers(req, res){

    var userId = req.user.sub;

    if(req.params.id && req.params.page){
        userId = req.params.id;
    }

    var page = 1;

    if(req.params.page){
        page = req.params.page; 
    } else {
        page = req.params.id;
    }

    var itemsPerPage = 10;


    Follow.find({user:userId}).populate({path: 'followed'}).paginate(page, itemsPerPage, (err, follows, total) => {
        if(err) return res.status(500).send({message: 'Error en el servidor'});

        if(!follows) return res.status(404).send({message: 'No estas siguiendo a ningun usuario'});

        followThisUserIds(req.user.sub).then((value) => {
            return res.status(200).send({
                total: total,
                pages: Math.ceil(total/itemsPerPage), 
                follows, 
                users_followig: value.following,
                users_follow_me: value.followed
            });
        });
    });
   
}

//Devolver usuarios que sigo o me siguen (si le paso true) sin paginar
function getMyFollows(req, res) {
    var userId = req.user.sub;

    var find = Follow.find({user: userId});

    if(req.params.followed){
        find = Follow.find({followed: userId});
    }

    find.populate('user followed').exec((err, follows) => {
        if(err) return res.status(500).send({message: 'Error en el servidor'});

        if(!follows) return res.status(404).send({message: 'No sigues ningun usuario'});

        return res.status(200).send({follows});
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





module.exports = {
    saveFollow, 
    deleteFollow, 
    getFollowingUsers, 
    getFollowedUsers, 
    getMyFollows
}