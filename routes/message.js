'use strict'

var expres = require('express');
var MessageController = require('../controllers/message');
var api = expres.Router();
var md_auth = require('../middlewares/authenticated');

api.get('/probando-md', md_auth.ensureAuth, MessageController.probandoMessage);
api.post('/message', md_auth.ensureAuth, MessageController.saveMessage);
api.get('/my-messages/:page?', md_auth.ensureAuth, MessageController.getReceiverMessage);
api.get('/messages/:page?', md_auth.ensureAuth, MessageController.getEmmitMessages);
api.get('/unviewed-messages', md_auth.ensureAuth, MessageController.getUnviewedMessages);
api.get('/set-unviewed-messages', md_auth.ensureAuth, MessageController.setViewedMessage );

module.exports = api;