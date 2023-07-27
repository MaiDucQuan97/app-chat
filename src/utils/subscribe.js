const webPush = require('web-push')

const vapidKeys = webPush.generateVAPIDKeys();
webPush.setVapidDetails('mailto:quan22061997@gmail.com', vapidKeys.publicKey, vapidKeys.privateKey);

const sendMessageNotificationToClient = (subscription, messageData) => {
    if (subscription && Object.keys(subscription).length !== 0 && subscription.constructor === Object) {
        webPush.sendNotification(
            subscription, 
            JSON.stringify({type_noti: 'message',username: messageData.username, message: messageData.message})
        ).catch((err) => {
            console.error('Error sending message push notification:', err);
        });
    }
}

const sendVideoNotificationToClient = (subscription) => {
    if (subscription && Object.keys(subscription).length !== 0 && subscription.constructor === Object) {
        webPush.sendNotification(
            subscription, 
            JSON.stringify({type_noti: 'video', message: 'Incomming call!'})
        ).catch((err) => {
            console.error('Error sending video push notification:', err);
        });
    }
}

module.exports = {
    sendMessageNotificationToClient,
    sendVideoNotificationToClient,
    vapidKeys
}
