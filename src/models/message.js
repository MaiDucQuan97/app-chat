const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    messageId: {
        type: String,
        require: true,
        unique: true
    },
    previousId: {
        type: String,
        require: true
    },
    nextId: {
        type: String,
        require: true
    },
    content: {
        type: String,
        trim: true
    },
    senderUsername: {
        type: String,
        required: true,
        trim: true
    },
    recipientUsername: {
        type: String,
        required: true,
        trim: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    reactions: [{
        reaction: {
            reactionType: {
                type: String
            },
            userID: {
                type: String
            },
            reactionTime: {
                type: Date,
                default: Date.now
            }
        }
    }]
}, {
    timestamps: true
})

messageSchema.statics.getAllMessagesOfCurrentUser = async function (senderUsername, recipientUsername) {
    let messages = []

    if (senderUsername !== recipientUsername) {
        messages = await Message.find({
            $or: [
                { senderUsername: recipientUsername, recipientUsername: senderUsername },
                { senderUsername, recipientUsername }
            ]
        }).sort({ sentAt: 1 })
    } else {
        messages = await Message.find({
            senderUsername,
            recipientUsername
        }).sort({ sentAt: 1 })
    }

    return messages
}

messageSchema.statics.getNewestMessageOfCurrentUser = async function (senderUsername, recipientUsername) {
    let latestMessage = await Message.findOne({ senderUsername, recipientUsername }).sort({ sentAt: -1 }).limit(1)

    if (!latestMessage && senderUsername !== recipientUsername) {
        latestMessage = await Message.findOne({
            senderUsername: recipientUsername,
            recipientUsername: senderUsername
        }).sort({ sentAt: -1 }).limit(1)
    }

    return latestMessage
}

const Message = mongoose.model('Message', messageSchema)

module.exports = Message