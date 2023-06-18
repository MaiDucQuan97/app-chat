const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    messageId: {
        type: String,
        require: true,
        unique: true
    },
    previousId: {
        type: String,
        require: true,
        unique: true
    },
    nextId: {
        type: String,
        require: true,
        unique: true
    },
    content: {
        type: String,
        require: true,
        trim: true
    },
    senderUsername: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    recipientUsername: {
        type: String,
        required: true,
        unique: true,
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
    const messages = await Message.find({ senderUsername, recipientUsername }).sort({ sentAt: -1 })

    if (messages.length === 0) {
        throw new Error('No messages found.')
    }

    return messages
}

messageSchema.statics.getNewestMessageOfCurrentUser = async function (senderUsername, recipientUsername) {
    const latestMessage = await Message.findOne({ senderUsername, recipientUsername }).sort({ sentAt: -1 }).limit(1)

    if (!latestMessage) {
        throw new Error('Message does not exist.')
    }

    return latestMessage
}

const Message = mongoose.model('Message', messageSchema)

module.exports = Message