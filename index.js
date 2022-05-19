const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');


const port = 3000;

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

var Message = mongoose.model('Message',{
    message : String
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
        const message = new Message(req.body);

        await message.save();
        console.log('Message saved');
    }
    catch (error){
        res.sendStatus(500);
        return console.log('error',error);
    }
})

mongoose.connect(dbUrl);

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.listen(port, () => {
    console.log(`Chat app listening on port ${port}.`);
})
