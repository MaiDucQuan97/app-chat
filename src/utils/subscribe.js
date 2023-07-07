const webPush = require('web-push')

const vapidKeys = webPush.generateVAPIDKeys();
webPush.setVapidDetails('mailto:quan22061997@gmail.com', vapidKeys.publicKey, vapidKeys.privateKey);

const sendNotificationToClient = (subscription, messageData) => {
    if (subscription && Object.keys(subscription).length !== 0 && subscription.constructor === Object) {
        webPush.sendNotification(
            subscription, 
            JSON.stringify({username: messageData.username, message: messageData.message})
        ).catch((err) => {
            console.error('Error sending push notification:', err);
        });
    }
}

module.exports = {
    sendNotificationToClient,
    vapidKeys
}
