var path = require("path");
var express = require("express");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});
const port = 3000
const messageReactions = {};

app.use(express.static('src/public'));

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + '/views/chat.html'));
});

io.on('connection', function (socket) {
    socket.on('send message', function (data) {
        const messageId = (!data.id) ? generateMessageId() : data.id
        let message = {}

        if (!data.id) {
            message = {
                id: messageId,
                message: data.message,
                username: data.username,
                reactions: [],
            };
            messageReactions[messageId] = message;
        } else {
            messageReactions[messageId]['message'] = data.message
            message = messageReactions[messageId]
            message.isEdit = true
        }

        io.sockets.emit('new message', message);
    });

    socket.on('react message', (data) => {
        const { messageId, reaction } = data;

        if (messageReactions.hasOwnProperty(messageId)) {
            const message = messageReactions[messageId];

            const existingReaction = message.reactions.find((r) => r.user === socket.id);

            if (existingReaction) {
                existingReaction.reaction = reaction;
            } else {
                message.reactions.push({ user: socket.id, reaction });
            }

            io.emit('update reactions', { messageId, reactions: message.reactions });
        }
    });
});

function generateMessageId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
});
