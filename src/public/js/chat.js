$(function () {
    let isShowMoreDropdownList = false

    const sendMessage = function () {
        let username = $('#username').val();
        let message = $('#message').val();

        if (username == '' || $.trim(message) == '') {
            alert('Please enter name and message!!');
        } else {
            socket.emit('send', { username: username, message: message });
            $('#message').val('');
        }
    }

    const getCurrentTime = function () {
        let dt = new Date($.now())

        return `${dt.getHours()}:${dt.getMinutes()}`
    }

    const generateElementId = function (name) {
        return `${name}-${Math.floor(Math.random() * 26)}${Date.now()}`
    }

    const deleteMessage = function (lineMessageId) {
        let messageTextDeleted = `<div class='line-message' id=${lineMessageId}><p class='message deleted'>This message was deleted!</p></div>`
        $(`#${lineMessageId}`).replaceWith(messageTextDeleted)
    }

    var socket = io.connect('http://localhost:3000');

    socket.on("send", function (data) {
        let lineMessageId = generateElementId('line-message'),
            messageId = generateElementId('message'),
            moreId = generateElementId('more'),
            actionBoxId = generateElementId('action-box'),
            moreDropdownListId = generateElementId('more-dropdown-list'),
            messageText = `<div class='line-message' id=${lineMessageId}><div class='message-container' id=${messageId}>`
                + `<div class='message-header'><span class='username'>${data.username}</span> <span class='time'>(${getCurrentTime()}):</span></div>`
                + `<div class='message-content'>${data.message}</div></div>`,
            messageActionBlock = `<div class='action-box' id=${actionBoxId}><button class='reaction' title='Add reaction'><i class='smile outline icon'></i></button>`
                + `<button class='more' id=${moreId} title='More'><i class='ellipsis vertical icon'></i></button>`
                + `<div class='more-dropdown-list' id=${moreDropdownListId}><div class='reaction'>Add reaction</div>`
                + "<div class='edit'><i class='edit icon'></i>Edit</div><div class='delete'><i class='trash icon'></i>Delete</div></div>"
                + "</div></div>",
            messageBlock = messageText + messageActionBlock


        $("#content").append(messageBlock)

        let moreButtonElement = $(`#${moreDropdownListId}`),
            lineMessageElement = $(`#${lineMessageId}`),
            actionBoxElement = $(`#${actionBoxId}`),
            messageContentElement = $(`#${messageId} .message-content`)

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
        })

        $(`#${lineMessageId}`).hover(function () {
            if (!isShowMoreDropdownList) {
                $(this).css('background-color', '#F2F3F5')
                $(this).find('.action-box').css('display', 'inline-block')
            }
        }, function () {
            if (!isShowMoreDropdownList) {
                $(this).css('background-color', '')
                $(this).find('.action-box').css('display', 'none')
            }
        })
    })

    $("#sendMessage").on('click', function () {
        sendMessage()
    })

    $("#message").bind("enterKey", function (e) {
        sendMessage()
    });
    // $("#message").keyup(function (e) {
    //     if (e.keyCode == 13) {
    //         $(this).trigger("enterKey");
    //     }
    // });
})
