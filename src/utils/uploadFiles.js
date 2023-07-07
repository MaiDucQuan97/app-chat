const path = require('path');
const Message = require('../models/message')
const { generateMessageId } = require('./messages')

const generateUniqueFileName = (originalFileName) => {
    let timestamp = Date.now(),
        randomString = Math.random().toString(36).substring(2, 15),
        fileExtension = path.extname(originalFileName),
        fileNameWithoutExtension = path.basename(originalFileName, fileExtension);

    return `${fileNameWithoutExtension}_${timestamp}_${randomString}${fileExtension}`;
}

const storeUploadFileMessage = async (fileName, senderUsername, recipientUsername ) => {
    try {
        let currentMessageData = {
            messageId: generateMessageId(),
            content: fileName,
            senderUsername,
            recipientUsername,
            type: 'file',
            previousId: '',
            nextId: ''
        }

        let previousMessage = await Message.getNewestMessageOfCurrentUser(senderUsername, recipientUsername)

        if (previousMessage) {
            currentMessageData.previousId = previousMessage._id.toString()
        }

        const message = await Message(currentMessageData)

        await message.save()

        if (previousMessage) {
            previousMessage.nextId = message._id.toString()
            await previousMessage.save()
        }

        return message
    } catch (error) {
        console.log(error)
    }
}

const getFileType = (filePath) => {
    const extension = path.extname(filePath);
    if (extension === '.txt') {
        return 'text';
    } else if (
        extension === '.jpg' || extension === '.jpeg' || 
        extension === '.png' || extension === '.gif'
    ) {
        return 'image';
    } else {
        return 'unknown';
    }
}

module.exports = {
    generateUniqueFileName,
    storeUploadFileMessage,
    getFileType
}