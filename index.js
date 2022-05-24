const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const http = require('http');
var path = require('path');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const rug = require('random-username-generator');
const sessions = require('express-session');

const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const sessionMiddleware = sessions({
    secret: "secret",
    resave: false,
    saveUninitialized: false
})

app.use(sessionMiddleware);

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

var Message = mongoose.model('Message',{
    username: String,
    message: String
});

var dbUrl = 'mongodb://mongo:27017/chat-app';

app.get('/messages', (req, res) => {
    Message.find({},(err, messages)=> {
        res.send(messages);
    })
})

app.post('/messages', async (req, res) => {
    try{
        if (!req.session.username) {
            req.session.username = req.body.username;
        }

        const message = new Message({
            username: req.body.username,
            message: req.body.message
        });

        await message.save();
        console.log('Message saved.');

        io.emit('message', message);
        res.sendStatus(200);
    }
    catch (error){
        res.sendStatus(500);
        return console.log('error',error);
    }
})

mongoose.connect(dbUrl);

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

const sockets = {}

io.on('connection', (socket) => {
    const session = socket.request.session;

    if (session.username) {
        username = session.username;
    } else {
        username = rug.generate();
    }

    sockets[socket.id] = username;
    socket.emit('name-generated', sockets[socket.id]);
    io.emit('update-peers', Object.values(sockets));

    socket.on('disconnect', () => {
        username = sockets[socket.id];
        delete sockets[socket.id];
        io.emit('update-peers', Object.values(sockets));

        console.log(`User ${username} disconnected.`);
    });

    console.log(`User ${username} connected.`);
});

server.listen(port, () => {
    console.log(`Chat app listening on port ${port}.`);
})
