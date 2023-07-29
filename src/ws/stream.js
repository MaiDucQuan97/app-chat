const fs  = require('fs')
const path = require('path')

const { generateMessage, generateMessageId , storeMessage } = require('../utils/messages')
const { generateUniqueFileName, storeUploadFileMessage, getFileType } = require('../utils/uploadFiles')
const { sendMessageNotificationToClient, vapidKeys } = require('../utils/subscribe')

const connectedUsers = new Map()
const messageReactions = {};
let subscriptions = []

const stream = (socket, io) => {
    socket.join(socket.userID)

    connectedUsers.set(socket.userID, {
        id: socket.userID,
        username: socket.username,
        online: true
    });

    emitCurrentUserId(socket.userID, io)
    emitGenerateNewSubscription(socket.userID, vapidKeys.publicKey, io)
     
    emitUserList(io)

    socket.on('sendMessage', async function (data) {
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
            await io.to(socket.userID).emit('newMessage', {
                messageData,
                from: socket.userID,
                to: data.toId
            })
        }
        await io.to(data.toId).emit('newMessage', {
            messageData,
            from: socket.userID,
            to: data.toId
        })
        await storeMessage({ messageData, recipientUsername: data.toUsername })
        sendMessageNotificationToClient(subscriptions[data.toId], messageData)
    });

    socket.on('reactMessage', (data) => {
        const { messageId, reaction } = data;

        if (messageReactions.hasOwnProperty(messageId)) {
            const message = messageReactions[messageId];

            const existingReaction = message.reactions.find((r) => r.user === socket.userID);

            if (existingReaction) {
                existingReaction.reaction = reaction;
            } else {
                message.reactions.push({ user: socket.userID, reaction });
            }

            io.emit('updateReactions', { messageId, reactions: message.reactions });
        }
    });

    socket.on('subscribe', (subscription) => {
        currentSubscription = subscription
        subscriptions[socket.userID] = subscription
    });
    
    socket.on("upload", async ({files, originalFileNames, toUsername}) => {
        let uploadedFiles = [];

        Object.keys(files).forEach((key) => {
            try {
                let file = files[key],
                originalFileName = originalFileNames[key],
                fileName = generateUniqueFileName(originalFileName),
                uploadFolderPath = path.join(process.cwd(), 'src/public/uploadFolder'),
                filePath = path.join(process.cwd(), 'src/public/uploadFolder', fileName),
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
            } catch (error) {
                console.log(error)
            }
        })

        let messageData = await storeUploadFileMessage(JSON.stringify(uploadedFiles), socket.username, toUsername)
        socket.emit('uploadResponse', messageData );
    });

    socket.on('calling', ({from, to, type}) => {
        io.to( to ).emit( 'incommingCall', {from, type});
        setTimeout(() => {
            io.to( to ).emit( 'cancelIncommingCall');
            io.to( from ).emit( 'cancelIncommingCall');
        }, 30000)
    })

    socket.on('cancelCalling', ({from, to}) => {
        io.to( to ).emit( 'cancelIncommingCall');
    })

    socket.on('rejectIncommingCalling', (from) => {
        io.to( from ).emit('callRejected')
    })

    socket.on('answerIncommingCalling', ({from, to}) => {
        io.to( from ).emit('callAnswered', to)
    })

    socket.on( 'subscribeVideoCall', ( data ) => {
        socket.join( data.room );
        socket.join( data.socketId );

        if ( socket.adapter.rooms.has(data.room) === true ) {
            socket.to( data.room ).emit( 'newUser', { socketId: data.socketId } );
        }
    } );

    socket.on( 'newUserStart', ( data ) => {
        socket.to( data.to ).emit( 'newUserStart', { sender: data.sender } );
    } );

    socket.on( 'sdp', ( data ) => {
        io.to( data.to ).emit( 'sdp', { description: data.description, sender: data.sender } );
    } );

    socket.on( 'iceCandidates', ( data ) => {
        io.to( data.to ).emit( 'iceCandidates', { candidate: data.candidate, sender: data.sender } );
    } );

    socket.on("disconnect", () => {
        connectedUsers.delete(socket.userID);
        emitUserList(io);
    });
}

const emitUserList = (io) => {
    const userList = Array.from(connectedUsers.values());

    io.emit("users", userList);
}

const emitCurrentUserId = (userID, io) => {
    io.to(userID).emit('currentUserId', userID)
}

const emitGenerateNewSubscription = (userID, publicKey, io) => {
    io.to(userID).emit('generateNewSubscription', publicKey)
}

module.exports = {
    stream
}