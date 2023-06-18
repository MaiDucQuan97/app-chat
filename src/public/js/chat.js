$(function () {
    let isShowMoreDropdownList = false,
        isShowReactionList = false,
        editMessageId = '',
        userList = [],
        selectedUserId = '',
        selectedUsername = '',
        currentUserId = ''

    const socket = io();

    const sendMessage = function () {
        let messageValue = $('#message').val()

        if ($.trim(messageValue) == '') {
            alert('Please enter name and message!!');
        } else {
            if (!selectedUserId && userList.length !== 0) {
                selectedUserId = userList[0].id
                selectedUsername = userList[0].username
            }
    
            socket.emit('send message', {
                message: messageValue,
                id: editMessageId,
                toId: selectedUserId,
                toUsername: selectedUsername
            });
            $('#message').val('');
        }
    }

    const reactMessage = function (messageId, reaction) {
        socket.emit('react message', { messageId, reaction });
    }

    const scrollToBottom = function () {
        $('#messages')[0].scrollTop = $('#messages')[0].scrollHeight
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
    }

    socket.on("new message", function ({messageData, from, to}) {
        const id = messageData.id,
              isEdit = messageData.isEdit,
              message = messageData.message,
              username = messageData.username,
              createdAt = messageData.createdAt

        let lineMessageId = generateElementId('message', id),
            messageId = generateElementId('message__container', id),
            actionBoxId = generateElementId('message__action', id),
            buttonReactionId = generateElementId('message__reactionbutton', id),
            reactionIconList = generateElementId('message__reactionlist', id),
            moreId = generateElementId('message__morebutton', id),
            moreDropdownListId = generateElementId('message__dropdownlist', id),
            messageTemplateElm = $('#message-template'),
            messagesElm = $('#messages')

        if (isEdit) {
            $(`#${messageId} .message__content`).text(message)
        } else {
            const html = Mustache.render(messageTemplateElm.html(), {
                id: id,
                username,
                message,
                createdAt: moment(createdAt).format('h:mm a')
            })

            messagesElm.append(html)
        }

        let moreButtonElement = $(`#${moreDropdownListId}`),
            lineMessageElement = $(`#${lineMessageId}`),
            actionBoxElement = $(`#${actionBoxId}`),
            messageContentElement = $(`#${messageId} .message__content`),
            reactionIconListElement = $(`#${reactionIconList}`)

        if (!isEdit) {
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

        scrollToBottom()
    })

    socket.on('update reactions', (data) => {
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
        userList = this.users = users.sort((a, b) => {
            if (currentUserId && a.id === currentUserId) return -1;
            if (currentUserId && b.id === currentUserId) return 1;
            if (a.username < b.username) return -1;
            return a.username > b.username ? 1 : 0;
        });

        let userTemplateElm = $('#user-template'),
            userListElm = $('#user-list')

        const html = Mustache.render(userTemplateElm.html(), { users: users })

        userListElm.empty()
        userListElm.append(html)

        $('#user-list .user').on('click', function (e) {
            e.preventDefault()
            selectedUserId = $(this).attr('id')
            selectedUsername = $(this).find('span').text()
            $('#messages').empty()
        })
    })

    socket.on('current_user_id', (userID) => {
        currentUserId = userID;
        console.log(currentUserId)
    });

    $("#message-form").on('submit', function (e) {
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
                console.log(response)
                window.location.href = '/login'
            },
            error: function (xhr, status, error) {
                console.log(xhr.responseText)
                alert('Logout failed. Please try again.');
            }
        });
    })
})
