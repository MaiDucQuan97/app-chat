$(function () {
    const sendMessage = function () {
        let username = $('#username').val();
        let message = $('#message').val();

        if (username == '' || message == '') {
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

    const deleteMessage = function (element, messageActionBlock) {
        let messageTextDeleted = "<div class='line-message'><p class='message deleted'>This message was deleted!</p>",
            messageBlockDeleted = messageTextDeleted + messageActionBlock
        $(element).closest('.message').replaceWith(messageBlockDeleted)
    }

    var socket = io.connect('http://localhost:3000');

    socket.on("send", function (data) {
        let messageText = "<div class='line-message'><p class='message'>" + `${data.username} (${getCurrentTime()}): ${data.message}` + "</p>",
            messageActionBlock = "<div class='action-box'><button class='reaction' title='Add reaction'><i class='smile outline icon'></i></button>"
                + "<button class='more' title='More'><i class='ellipsis vertical icon'></i>"
                + "<div class='more-dropdown-list'><div class='reaction'>Add reaction</div>"
                + "<div class='edit'><i class='edit icon'></i>Edit</div><div class='delete'><i class='trash icon'></i>Delete</div></div>"
                + "</button></div></div>",
            messageBlock = messageText + messageActionBlock


        $("#content").append(messageBlock)

        $(".more").on("click", function () {
            let self = this
            $(self).find('.more-dropdown-list').show()
            switch ($(self).attr('class')) {
                case 'delete':
                    deleteMessage(self, messageActionBlock)
                    break;
                case 'edit':

                    break;
                default:
                // code block
            }
        })
    })

    $("#sendMessage").on('click', function () {
        sendMessage()
    })

    $("#message").bind("enterKey", function (e) {
        sendMessage()
    });
    $("#message").keyup(function (e) {
        if (e.keyCode == 13) {
            $(this).trigger("enterKey");
        }
    });
})
