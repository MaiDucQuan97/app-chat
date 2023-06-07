$(function () {
    let isShowMoreDropdownList = false,
        isShowReactionList = false,
        editMessageId = ''

    const sendMessage = function () {
        let username = $('#username').text();
        let message = $('#message').val();

        if (username == '' || $.trim(message) == '') {
            alert('Please enter name and message!!');
        } else {
            socket.emit('send message', { username: username, message: message, id: editMessageId });
            $('#message').val('');
        }
    }

    const reactMessage = function (messageId, reaction) {
        socket.emit('react message', { messageId, reaction });
    }

    const getCurrentTime = function () {
        let dt = new Date($.now())

        return `${dt.getHours()}:${dt.getMinutes()}`
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

    var socket = io.connect('http://localhost:3000');

    socket.on("new message", function (data) {
        let lineMessageId = generateElementId('line-message', data.id),
            messageId = generateElementId('message', data.id),
            moreId = generateElementId('more', data.id),
            actionBoxId = generateElementId('action-box', data.id),
            moreDropdownListId = generateElementId('more-dropdown-list', data.id),
            buttonReactionId = generateElementId('button-reaction', data.id),
            reactionsId = generateElementId('reaction', data.id),
            reactionIconList = generateElementId('reaction-icon', data.id),
            messageText = `<div class='line-message' id=${lineMessageId}><div class='message-container' id=${messageId}>`
                + `<div class='message-header'><span class='username'>${data.username}</span> <span class='time'>(${getCurrentTime()}):</span></div>`
                + `<div class='message-content'>${data.message}</div></div>`,
            messageActionBlock = `<div class='action-box' id=${actionBoxId}>`
                + `<button class='reaction' title='Add reaction' id=${buttonReactionId}><i class='smile outline icon'></i></button>`
                + `<div class='reaction-icon-list' id=${reactionIconList}>`
                + "<div class='emoji like'><div class='icon' data-title='Like'></div></div><div class='emoji love'><div class='icon' data-title='Love'></div></div>"
                + "<div class='emoji haha'><div class='icon' data-title='Haha'></div></div><div class='emoji wow'><div class='icon' data-title='Wow'></div></div>"
                + "<div class='emoji sad'><div class='icon' data-title='Sad'></div></div><div class='emoji angry'><div class='icon' data-title='Angry'></div></div>"
                + "</div>"
                + `<button class='more' id=${moreId} title='More'><i class='ellipsis vertical icon'></i></button>`
                + `<div class='more-dropdown-list' id=${moreDropdownListId}>`
                + "<div class='reaction'>Add reaction</div><div class='edit'><i class='edit icon'></i>Edit</div><div class='delete'><i class='trash icon'></i>Delete</div></div>"
                + "</div>",
            messageReactionsBlock = `<div class='reactions' id=${reactionsId}></div>`
        messageBlock = messageText + messageActionBlock + messageReactionsBlock + "</div>"

        if (data.isEdit) {
            $(`#${messageId} .message-content`).text(data.message)
        } else {
            $("#content").append(messageBlock)
        }


        let moreButtonElement = $(`#${moreDropdownListId}`),
            lineMessageElement = $(`#${lineMessageId}`),
            actionBoxElement = $(`#${actionBoxId}`),
            messageContentElement = $(`#${messageId} .message-content`),
            reactionIconListElement = $(`#${reactionIconList}`)

        if (!data.isEdit) {
            $(`#${moreId}`).on("click", function () {
                if (moreButtonElement.css('display') == 'none') {
                    isShowMoreDropdownList = true
                    moreButtonElement.show()
                    actionBoxElement.css('display', 'inline-block')
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
                editMessageId = getMessageIdFromElementId('message-', messageId)
            })

            $(`#${lineMessageId}`).hover(function () {
                if (!isShowMoreDropdownList && !isShowReactionList) {
                    $(this).css('background-color', '#F2F3F5')
                    $(this).find('.action-box').css('display', 'inline-block')
                }
            }, function () {
                if (!isShowMoreDropdownList && !isShowReactionList) {
                    $(this).css('background-color', '')
                    $(this).find('.action-box').css('display', 'none')
                }
            })

            $(`#${buttonReactionId}`).on("click", function () {
                const newOpacity = isShowReactionList ? 0 : 1;

                reactionIconListElement.css("opacity", newOpacity);
                isShowReactionList = !isShowReactionList;
            })

            $(`#${reactionIconList} div.icon`).on("click", function () {
                let messageId = getMessageIdFromElementId('reaction-icon-', reactionIconList)
                reactMessage(messageId, $(this).attr("data-title").toLowerCase())
            })
        }
    })

    socket.on('update reactions', (data) => {
        const { messageId, reactions } = data;
        let reactionsId = generateElementId('reaction', messageId),
            reactionIconList = generateElementId('reaction-icon', messageId),
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

    $("#sendMessage").on('click', function () {
        sendMessage()
        if (editMessageId) {
            $('.line-message').css('background-color', '')
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
                alert('Logout successful!');
                window.location.href = '/login'
            },
            error: function (xhr, status, error) {
                console.log(xhr.responseText)
                alert('Logout failed. Please try again.');
            }
        });
    })
})
