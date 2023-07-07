const Message = require('../models/message')

const storeMessage = async ({ messageData, recipientUsername }) => {
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

const generateMessage = (messageId, data) => {
    return {
        id: messageId,
        message: data.message,
        username: data.username,
        createdAt: new Date().getTime(),
        reactions: [],
    }
}

const generateMessageId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5)

module.exports = {
    generateMessage,
    generateMessageId,
    storeMessage
}