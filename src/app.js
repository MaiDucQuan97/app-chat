require('./db/mongoose')
const express = require("express");
const session = require('express-session');

const app = express();
const routeUser = require('./routers/user'),
    routePage = require('./routers/page')
const server = require('http').createServer(app);
const port = process.env.PORT
const io = require('socket.io')(server, {
    cors: {
        origin: `http://localhost:${port}`,
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});
const messageReactions = {};

app.use(
    session({
        secret: 'app_chat_secret_key',
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            maxAge: 3600000
        },
    })
);
app.use((req, res, next) => {
    if (req.session && req.session.cookie.expires < Date.now()) {
        console.log('Session expired:', req.sessionID);
    }

    next();
});
app.use(express.json())
app.use(routeUser)
app.use(routePage)
app.use(express.static('src/public'));

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
