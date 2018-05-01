'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');

function probandoMessage(req, res){
    res.status(200).send({message: 'hola que tal desde mensaje proivados'});
}

//enviar mensajes
function saveMessage(req, res){
    var params = req.body;

    if(!params.text || !params.receiver) return res.status(200).send({message: 'EL mensaje envia los datos necesarios'});

    var message = new Message();
    message.emmiter = req.user.sub;
    message.receiver = params.receiver;
    message.text = params.text;
    message.created_at = moment().unix();
    message.viewed = false;

    message.save((err, messageStored) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!messageStored) return res.status(500).send({message: 'Error al enviar el mensaje'});

        return res.status(200).send({message: messageStored});
    });
}

//Listar los mensajes recibidos
function getReceiverMessage(req, res){
    var userId  = req.user.sub;

    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Message.find({receiver: userId}).populate('emmiter', 'name surname _id nick image').paginate(page, itemsPerPage, (err, messages, total) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!messages) return res.status(404).send({message: 'NO hay mensajes'});

        return res.status(200).send({
            total: total, 
            pages: Math.ceil(total/itemsPerPage),
            messages
        })

    });

}

//Listar los mensajes enviados
function getEmmitMessages(req, res){
    var userId  = req.user.sub;

    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Message.find({emmiter: userId}).populate('emmiter receiver', 'name surname _id nick image').paginate(page, itemsPerPage, (err, messages, total) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!messages) return res.status(404).send({message: 'NO hay mensajes'});

        return res.status(200).send({
            total: total, 
            pages: Math.ceil(total/itemsPerPage),
            messages
        })

    });
}

//contar mensajes sin leer 
function getUnviewedMessages(req, res){
    var userId = req.user.sub;

    Message.count({receiver: userId, viewed:'false'}).exec((err, count) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});
        return res.status(200).send({
            'unviewed': count
        });
    });
}

//marcar mensajes leido
function setViewedMessage(req, res){
    var userId = req.user.sub;

    Message.update({receiver: userId, viewed: false}, {viewed: true}, {"multi":true}, (err, messageUpdated) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});

        return res.status(200).send({
            messages: messageUpdated
        })
    });
}

module.exports = {
    probandoMessage, 
    saveMessage, 
    getReceiverMessage, 
    getEmmitMessages, 
    getUnviewedMessages, 
    setViewedMessage
}