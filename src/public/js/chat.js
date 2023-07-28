$(function () {
    $(window).keydown(function(event){
        if(event.keyCode == 13) {
          event.preventDefault();
          return false;
        }
    });

    let isShowMoreDropdownList = false,
        isShowReactionList = false,
        editMessageId = '',
        userList = [],
        selectedUserId = '',
        selectedUsername = '',
        currentUserId = '',
        callingFrom = ''

    const socket = io();
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    const sendMessage = function () {
        let messageValue = $('#message').val()

        if ($.trim(messageValue) == '') {
            alert('Please enter name and message!!');
        } else {
            if (!selectedUserId && userList.length !== 0) {
                selectedUserId = userList[currentUserId].id
                selectedUsername = userList[currentUserId].username
            }

            socket.emit('sendMessage', {
                message: messageValue,
                id: editMessageId,
                toId: selectedUserId,
                toUsername: selectedUsername
            });
            $('#message').val('');
        }
    }

    const reactMessage = function (messageId, reaction) {
        socket.emit('reactMessage', { messageId, reaction });

        // todo: process save react icon in db
    }

    const scrollToBottom = function (isSendTextMessage = false, loadedImg = 0) {
        let messageElm = $('#messages'),
            images = messageElm.find("img")
        
        images.on("load", function() {
            loadedImg++
            if (loadedImg == images.length) {
                $('#messages')[0].scrollTop = $('#messages')[0].scrollHeight
            }
        })

        if (images.length === 0 || isSendTextMessage) {
            $('#messages')[0].scrollTop = $('#messages')[0].scrollHeight
        }
    }

    const generateElementId = function (name, id) {
        return `${name}-${id}`
    }

    const getMessageIdFromElementId = function (name, elementId) {
        return elementId.substring(elementId.indexOf(name) + name.length)
    }

    const deleteMessage = function (lineMessageId) {
        let messageTextDeleted = `<div class='line-message' id=${lineMessageId}><p class='message deleted'>This message was deleted!</p></div>`
        $(`#${lineMessageId}`).replaceWith(messageTextDeleted)

        // todo: process delete message in db
    }

    const urlBase64ToUint8Array = function (base64String) {
        var padding = '='.repeat((4 - base64String.length % 4) % 4);
        var base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
    
        var rawData = window.atob(base64);
        var outputArray = new Uint8Array(rawData.length);
    
        for (var i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    const addTriggerMessageActions = function (id) {
        let lineMessageId = generateElementId('message', id),
            messageId = generateElementId('message__container', id),
            actionBoxId = generateElementId('message__action', id),
            buttonReactionId = generateElementId('message__reactionbutton', id),
            reactionIconList = generateElementId('message__reactionlist', id),
            moreId = generateElementId('message__morebutton', id),
            moreDropdownListId = generateElementId('message__dropdownlist', id),
            moreButtonElement = $(`#${moreDropdownListId}`),
            lineMessageElement = $(`#${lineMessageId}`),
            actionBoxElement = $(`#${actionBoxId}`),
            messageContentElement = $(`#${messageId} .message__content`),
            reactionIconListElement = $(`#${reactionIconList}`)

        $(`#${moreId}`).on("click", function () {
            if (moreButtonElement.css('display') == 'none') {
                isShowMoreDropdownList = true
                moreButtonElement.show()
                actionBoxElement.css('display', 'flex')
                lineMessageElement.css('background-color', '#F2F3F5')
            } else {
                isShowMoreDropdownList = false
                moreButtonElement.hide()
                actionBoxElement.hide()
                lineMessageElement.css('background-color', '')
            }
        })

        $(`#${moreDropdownListId} .delete`).on("click", function () {
            deleteMessage(lineMessageId)
            isShowMoreDropdownList = false
        })

        $(`#${moreDropdownListId} .edit`).on("click", function () {
            moreButtonElement.hide()
            lineMessageElement.css('background-color', '#FFF6D6')
            $("#message").val(messageContentElement.text()).css('background-color', '#FFF6D6')
            editMessageId = getMessageIdFromElementId('message__container-', messageId)
        })

        $(`#${lineMessageId}`).hover(function () {
            if (!isShowMoreDropdownList && !isShowReactionList) {
                $(this).css('background-color', '#F2F3F5')
                $(this).find('.message__action').css('display', 'flex')
            }
        }, function () {
            if (!isShowMoreDropdownList && !isShowReactionList) {
                $(this).css('background-color', '')
                $(this).find('.message__action').css('display', 'none')
            }
        })

        $(`#${buttonReactionId}`).on("click", function () {
            const newOpacity = isShowReactionList ? 0 : 1;

            reactionIconListElement.css("opacity", newOpacity);
            isShowReactionList = !isShowReactionList;
        })

        $(`#${reactionIconList} div.icon`).on("click", function () {
            let messageId = getMessageIdFromElementId('message__reactionlist-', reactionIconList)
            reactMessage(messageId, $(this).attr("data-title").toLowerCase())
        })
    }

    const uploadFile = function (files) {
        let originalFileNames = []

        if (!selectedUserId && userList.length !== 0) {
            selectedUserId = userList[currentUserId].id
            selectedUsername = userList[currentUserId].username
        }
        
        Object.keys(files).forEach((key) => {
            let file = files[key]
            originalFileNames[key] = file.name
        })

        socket.emit("upload", {
            files, 
            originalFileNames,
            toUsername: selectedUsername
        });
    }

    const hideAllCallingNotification = () => {
        let ringtone = $('#ringtone')

        ringtone[0].pause()
        $('.chat__callnotification').hide()
        $('#calling-notification').hide()
        $('#incomming-call-notification').hide()
    }

    socket.on("newMessage", function ({ messageData, from, to }) {
        const id = messageData.id,
            isEdit = messageData.isEdit,
            message = messageData.message,
            username = messageData.username,
            createdAt = messageData.createdAt

        let messageId = generateElementId('message__container', id),
            messageTemplateElm = $('#message-template'),
            messagesElm = $('#messages')

        if (isEdit) {
            $(`#${messageId} .message__content`).text(message)
        } else {
            const html = Mustache.render(messageTemplateElm.html(), {
                id: id,
                username,
                message,
                createdAt: moment(createdAt).format('h:mm a'),
                type_text: true,
                type_image: false
            })

            messagesElm.append(html)
        }

        if (!isEdit) {
            addTriggerMessageActions(id)
        }

        scrollToBottom(true)
    })

    socket.on('updateReactions', (data) => {
        const { messageId, reactions } = data;
        let reactionsId = generateElementId('message__reactions', messageId),
            reactionIconList = generateElementId('message__reactionlist', messageId),
            reactionsElement = $(`#${reactionsId}`),
            reactionIconListElement = $(`#${reactionIconList}`)

        if (reactionsElement) {
            const reactionCount = {};
            reactions.forEach((reaction) => {
                if (reactionCount.hasOwnProperty(reaction.reaction)) {
                    reactionCount[reaction.reaction]++;
                } else {
                    reactionCount[reaction.reaction] = 1;
                }
            });
            reactionsElement.text(`(${reactionCount.like || 0} Like, ${reactionCount.love || 0} Love, ${reactionCount.haha || 0} Haha, ${reactionCount.wow || 0} Wow, ${reactionCount.sad || 0} Sad, ${reactionCount.angry || 0} Angry)`);
            reactionIconListElement.css("opacity", 0)
            isShowReactionList = false
        }
    });

    socket.on('users', (users) => {
        this.users = users.sort((a, b) => {
            if (currentUserId && a.id === currentUserId) return -1;
            if (currentUserId && b.id === currentUserId) return 1;
            if (a.username < b.username) return -1;
            return a.username > b.username ? 1 : 0;
        });

        users.forEach((user) => {
            userList[user.id] = user;
        });

        let userTemplateElm = $('#user-template'),
            userListElm = $('#user-list')

        const html = Mustache.render(userTemplateElm.html(), { users: users })

        userListElm.empty()
        userListElm.append(html)

        $('#user-list .user').on('click', function (e) {
            let messageTemplateElm = $('#message-template'),
                messagesElm = $('#messages'),
                messagesHtml = '',
                listMessageIds = []

            e.preventDefault()
            selectedUserId = $(this).attr('id')
            selectedUsername = $(this).find('span').text()

            messagesElm.empty()
            $.ajax({
                type: 'GET',
                url: '/user/me/messages',
                data: {
                    recipientUsername: selectedUsername
                },
                success: function (response) {
                    if (response.length !== 0) {
                        response.forEach((message) => {
                            if (message.type == 'file') {
                                let uploadedFiles = message.content ? JSON.parse(message.content) : [],
                                    imageFiles = [],
                                    otherFiles = [];

                                uploadedFiles.forEach((file) => {
                                    if (file.fileType === 'image') {
                                        imageFiles.push(file);
                                    } else {
                                        otherFiles.push(file);
                                    }
                                });
                                
                                messagesHtml += Mustache.render(messageTemplateElm.html(), {
                                    id: message.messageId,
                                    username: message.senderUsername,
                                    message: '',
                                    createdAt: moment(message.sentAt).format('h:mm a'),
                                    imageFiles: imageFiles,
                                    otherFiles: otherFiles
                                })
                            } else {
                                messagesHtml += Mustache.render(messageTemplateElm.html(), {
                                    id: message.messageId,
                                    username: message.senderUsername,
                                    message: message.content,
                                    createdAt: moment(message.sentAt).format('h:mm a'),
                                    type_text: true
                                })
                            }

                            listMessageIds.push(message.messageId)
                        })

                        messagesElm.append(messagesHtml)

                        listMessageIds.forEach((id) => {
                            addTriggerMessageActions(id)
                        })

                        scrollToBottom()
                    }
                },
                error: function (xhr, status, error) {
                    alert(error);
                }
            });
        })
    })

    socket.on('currentUserId', (userID) => {
        currentUserId = userID;
    });

    socket.on('generateNewSubscription', async (publicKey) => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker
                .register('js/service-worker.js')
                .then((registration) => {
                    registration.pushManager
                        .getSubscription()
                        .then((existSubscription) => {
                            if (existSubscription) {
                                existSubscription.unsubscribe();
                            }
                        })

                    return registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(publicKey),
                    });
                }).then((subscription) => {
                    socket.emit('subscribe', subscription);
                }).catch((error) => {
                    console.error('Error subscribing for push notifications:', error);
                    if (!error.toString().includes("permission denied")) {
                        location.reload()
                    }
                });
        }
    });

    socket.on('uploadResponse', (messageData) => {
        let messageTemplateElm = $('#message-template'),
            messagesElm = $('#messages'),
            uploadFileElement = '',
            uploadedFiles = messageData.content ? JSON.parse(messageData.content) : [],
            imageFiles = [],
            otherFiles = [],
            loadedImg = messagesElm.find("img");

        uploadedFiles.forEach((file) => {
            if (file.fileType === 'image') {
                imageFiles.push(file);
            } else {
                otherFiles.push(file);
            }
        });
            
        uploadFileElement += Mustache.render(messageTemplateElm.html(), {
            id: message.messageId,
            username: message.senderUsername,
            message: '',
            createdAt: moment(message.sentAt).format('h:mm a'),
            imageFiles: imageFiles,
            otherFiles: otherFiles
        })

        messagesElm.append(uploadFileElement)

        scrollToBottom(false, loadedImg.length)
    });

    socket.on('incommingCall', (from) => {
        const ringtone = $('#ringtone'),
              callerName = $('#caller-name');

        callerName.text(userList[from].username)
        $('.chat__callnotification').css('display', 'flex')
        $('#calling-notification').hide()
        $('#incomming-call-notification').show()
        ringtone[0].play();

        callingFrom = from
    })

    socket.on('cancelIncommingCall', () => {
        const callerName = $('#caller-name');

        callerName.text(null)
        hideAllCallingNotification()

        callingFrom = ''
    })

    socket.on('callRejected', () => {
        hideAllCallingNotification()
    })

    socket.on('callAnswered', (to) => {
        hideAllCallingNotification()

        let redirectUrl = `/video?toUserId=${to}&fromUserId=${currentUserId}`
        window.location.replace(redirectUrl)
    })

    $("#message").on("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
        }
    })

    $(document).on("click", "#video-call", () => {
        socket.emit('calling', {
            from: currentUserId,
            to: selectedUserId
        })
        $('.chat__callnotification').css('display', 'flex')
        $('#incomming-call-notification').hide()
        $('#calling-notification').show()
    })

    $(document).on("click", "#cancel-call", () => {
        hideAllCallingNotification()
        socket.emit('cancelCalling', {
            from: currentUserId,
            to: selectedUserId
        })
    })
    
    $(document).on("click", "#reject-call", () => {
        hideAllCallingNotification()
        socket.emit('rejectIncommingCalling', callingFrom)
    })

    $(document).on("click", "#answer-call", () => {
        hideAllCallingNotification()

        socket.emit('answerIncommingCalling', {from: callingFrom, to: currentUserId})  

        setTimeout(() => {
            let redirectUrl = `/video?toUserId=${callingFrom}&fromUserId=${currentUserId}`
            window.location.replace(redirectUrl)
        }, 2000)
    })

    $("#sendMessage").on("click", function (e) {
        e.preventDefault()
        sendMessage()
        if (editMessageId) {
            $('.message').css('background-color', '')
            $("#message").css('background-color', '')
            editMessageId = ''
        }
    })

    $('#logout-btn').on("click", function () {
        $.ajax({
            type: 'POST',
            url: '/user/logout',
            success: function (response) {
                window.location.href = '/login'
            },
            error: function (xhr, status, error) {
                alert('Logout failed. Please try again.');
            }
        });
    })

    $('#openInputFileButton').on("click", function () {
        $('#fileInput').click();
    })

    $('#fileInput').on("input", function () {
        uploadFile(this.files);
    })
})
