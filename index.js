const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const rug = require('random-username-generator');

let username = rug.generate();


const port = 3000;

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

var Message = mongoose.model('Message',{
    username: String,
    message: String
});

var dbUrl = 'mongodb://127.0.0.1:27017/chat-app';

app.get('/', (req, res) => {
    res.sendFile('index.html');
})

app.get('/messages', (req, res) => {
    Message.find({},(err, messages)=> {
        res.send(messages);
    })
})

app.post('/messages', async (req, res) => {
    try{
        const message = new Message({
            username: username,
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

io.on('connection', (socket) => {
    username = rug.generate();
    console.log(`User ${username} connected.`);
});

server.listen(port, () => {
    console.log(`Chat app listening on port ${port}.`);
})
