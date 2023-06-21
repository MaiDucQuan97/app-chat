require('./db/mongoose')
const express = require("express");
const session = require('express-session');
const path = require('path');
const socketio = require('socket.io')
const http = require('http')
const { generateMessage, generateMessageId } = require('./utils/messages')
const Message = require('./models/message')

const app = express();
const server = http.createServer(app)
const io = socketio(server)
const routeUser = require('./routers/user')
const routePage = require('./routers/page')
const port = process.env.PORT

const messageReactions = {};
const sessionMiddleware = session({
    secret: 'app_chat_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 3600000 // 1 hour
    },
})
app.use(sessionMiddleware);
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

app.use(express.json())
app.use(routeUser)
app.use(routePage)
app.use(express.static('src/public'));

io.use((socket, next) => {
    let session = socket.request.session

    if (!session.isLoggedIn) {
        return;
    }

    let user = session.user,
        username = user.username,
        userID = user._id,
        sessionID = session.sessionID

    socket.username = username;
    socket.sessionID = sessionID;
    socket.userID = userID
    next();
});

const connectedUsers = new Map();

io.on('connection', function (socket) {
    socket.join(socket.userID)

    connectedUsers.set(socket.userID, {
        id: socket.userID,
        username: socket.username,
        online: true
    });

    emitCurrentUserId(socket.userID)
    emitUserList()

    socket.on('send message', async function (data) {
        const messageId = (!data.id) ? generateMessageId() : data.id
        let messageData = {}

        if (!data.id) {
            data.username = socket.username
            messageData = messageReactions[messageId] = generateMessage(messageId, data);
        } else {
            messageReactions[messageId]['message'] = data.message
            messageData = messageReactions[messageId]
            messageData.isEdit = true
        }

        if (data.toId !== socket.userID) {
            await io.to(socket.userID).emit('new message', {
                messageData,
                from: socket.userID,
                to: data.toId
            })
        }
        await io.to(data.toId).emit('new message', {
            messageData,
            from: socket.userID,
            to: data.toId
        })
        await storeMessage({ messageData, recipientUsername: data.toUsername })
    });

    socket.on('react message', (data) => {
        const { messageId, reaction } = data;

        if (messageReactions.hasOwnProperty(messageId)) {
            const message = messageReactions[messageId];

            const existingReaction = message.reactions.find((r) => r.user === socket.userID);

            if (existingReaction) {
                existingReaction.reaction = reaction;
            } else {
                message.reactions.push({ user: socket.userID, reaction });
            }

            io.emit('update reactions', { messageId, reactions: message.reactions });
        }
    });

    socket.on("disconnect", () => {
        connectedUsers.delete(socket.id);
        emitUserList();
    });
});

function emitUserList() {
    const userList = Array.from(connectedUsers.values());

    io.emit("users", userList);
}

function emitCurrentUserId(userID) {
    io.to(userID).emit('current_user_id', userID)
}

async function storeMessage({ messageData, recipientUsername }) {
    try {
        let currentMessageData = {
            messageId: messageData.id,
            content: messageData.message,
            senderUsername: messageData.username,
            recipientUsername,
            previousId: '',
            nextId: ''
        }

        let previousMessage = await Message.getNewestMessageOfCurrentUser(messageData.username, recipientUsername)

        if (previousMessage) {
            currentMessageData.previousId = previousMessage._id.toString()
        }

        const message = await Message(currentMessageData)

        await message.save()

        if (previousMessage) {
            previousMessage.nextId = message._id.toString()
            await previousMessage.save()
        }
    } catch (error) {
        console.log(error)
    }
}

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
});
