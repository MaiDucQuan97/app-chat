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
    generateMessageId
}