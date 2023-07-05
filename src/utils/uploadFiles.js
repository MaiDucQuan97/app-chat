const path = require('path');

const generateUniqueFileName = (originalFileName) => {
    let timestamp = Date.now(),
        randomString = Math.random().toString(36).substring(2, 15),
        fileExtension = path.extname(originalFileName),
        fileNameWithoutExtension = path.basename(originalFileName, fileExtension);

    return `${fileNameWithoutExtension}_${timestamp}_${randomString}${fileExtension}`;
}

module.exports = {
    generateUniqueFileName
}