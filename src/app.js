require('./db/mongoose')
const express = require("express")
const path = require('path')
const socketio = require('socket.io')
const http = require('http')
const fs  = require('fs')
const { generateMessage, generateMessageId , storeMessage } = require('./utils/messages')
const { generateUniqueFileName, storeUploadFileMessage, getFileType } = require('./utils/uploadFiles')
const { sendNotificationToClient, vapidKeys } = require('./utils/subscribe')
const { sessionMiddleware } = require('./utils/session')

const app = express();
const server = http.createServer(app)
const io = socketio(server)
const routeUser = require('./routers/user')
const routePage = require('./routers/page')
const port = process.env.PORT

const messageReactions = {};
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
    
    socket.on("upload", async ({files, originalFileNames, toUsername}) => {
        let uploadedFiles = [];

        Object.keys(files).forEach((key) => {
            let file = files[key],
                originalFileName = originalFileNames[key],
                fileName = generateUniqueFileName(originalFileName),
                uploadFolderPath = path.join(__dirname, 'public/uploadFolder'),
                filePath = path.join(__dirname, 'public/uploadFolder', fileName),
                urlFilePath = path.join('uploadFolder', fileName),
                fileType = getFileType(filePath)

            if (!fs.existsSync(uploadFolderPath)) {
                fs.mkdirSync(uploadFolderPath);
            }

            fs.writeFile(filePath, file, (err) => {
                if (err) {
                    console.log(err)
                }
            })

            uploadedFiles.push({fileType, urlFilePath, originalFileName})
        })

        let messageData = await storeUploadFileMessage(JSON.stringify(uploadedFiles), socket.username, toUsername)
        socket.emit('uploadResponse', messageData );
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

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
});
