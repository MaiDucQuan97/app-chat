require('./db/mongoose')
const express = require("express");
const session = require('express-session');
const path = require('path');
const socketio = require('socket.io')
const http = require('http')
const { generateMessage, generateMessageId } = require('./utils/messages')
const Message = require('./models/message')
const User = require('./models/user')
const webPush = require('web-push');

const app = express();
const server = http.createServer(app)
const io = socketio(server)
const routeUser = require('./routers/user')
const routePage = require('./routers/page')
const port = process.env.PORT
const vapidKeys = webPush.generateVAPIDKeys();
webPush.setVapidDetails('mailto:quan22061997@gmail.com', vapidKeys.publicKey, vapidKeys.privateKey);

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

    socket.username = username
    socket.sessionID = sessionID
    socket.userID = userID
    next();
});

const connectedUsers = new Map()
let subscriptions = []

io.on('connection', function (socket) {
    socket.join(socket.userID)

    connectedUsers.set(socket.userID, {
        id: socket.userID,
        username: socket.username,
        online: true
    });

    emitCurrentUserId(socket.userID)
    emitGenerateNewSubscription(socket.userID, vapidKeys.publicKey)
     
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
        sendNotificationToClient(subscriptions[data.toId], messageData)
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

    socket.on('subscribe', (subscription) => {
        currentSubscription = subscription
        subscriptions[socket.userID] = subscription
    });
    
    socket.on("upload", (files, callback) => {
        let errors = []

        files.forEach((file) => {
            console.log(file);

            writeFile("/src/public/file", file, (err) => {
                errors.push(err)
            });
        })

        callback(errors)
    });

    socket.on("disconnect", () => {
        connectedUsers.delete(socket.userID);
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

function emitGenerateNewSubscription(userID, publicKey) {
    io.to(userID).emit('generate_new_subscription', publicKey)
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

function sendNotificationToClient(subscription, messageData) {
    if (subscription && Object.keys(subscription).length !== 0 && subscription.constructor === Object) {
        webPush.sendNotification(
            subscription, 
            JSON.stringify({username: messageData.username, message: messageData.message})
        ).catch((err) => {
            console.error('Error sending push notification:', err);
        });
    }
}

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
});
