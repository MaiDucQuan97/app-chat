const   messagesElm = $('#messages'),
        scrollToBottomButton = $('.scroll-to-bottom-button');

let isShowMoreDropdownList = false,
    isShowReactionList = false;

var pc = [];

export default {
    pc,
    createUniqueString(str1, str2) {
        const sortedStrings = [str1, str2].sort();
      
        const uniqueString = sortedStrings.join('-');
      
        return uniqueString;
    },

    closeVideo( elemId ) {
        if ( $(`#${elemId}`).length ) {
            $(`#${elemId}`).remove();
            this.adjustVideoElemSize();
        }
    },

    pageHasFocus() {
        return !( document.hidden || document.onfocusout || window.onpagehide || window.onblur );
    },

    getQString( url = '', keyToReturn = '' ) {
        url = url ? url : location.href;
        let queryStrings = decodeURIComponent( url ).split( '#', 2 )[0].split( '?', 2 )[1];

        if ( queryStrings ) {
            let splittedQStrings = queryStrings.split( '&' );

            if ( splittedQStrings.length ) {
                let queryStringObj = {};

                splittedQStrings.forEach( function ( keyValuePair ) {
                    let keyValue = keyValuePair.split( '=', 2 );

                    if ( keyValue.length ) {
                        queryStringObj[keyValue[0]] = keyValue[1];
                    }
                } );

                return keyToReturn ? ( queryStringObj[keyToReturn] ? queryStringObj[keyToReturn] : null ) : queryStringObj;
            }

            return null;
        }

        return null;
    },

    userMediaAvailable() {
        return !!( navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia );
    },

    getUserFullMedia() {
        if ( this.userMediaAvailable() ) {
            return navigator.mediaDevices.getUserMedia( {
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            } );
        } else {
            throw new Error( 'User media not available' );
        }
    },

    getUserAudio() {
        if ( this.userMediaAvailable() ) {
            return navigator.mediaDevices.getUserMedia( {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            } );
        } else {
            throw new Error( 'User media not available' );
        }
    },

    shareScreen() {
        if ( this.userMediaAvailable() ) {
            return navigator.mediaDevices.getDisplayMedia( {
                video: {
                    cursor: "always"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            } );
        } else {
            throw new Error( 'User media not available' );
        }
    },

    getIceServer() {
        return {
            iceServers: [
                {
                  urls: "stun:stun.relay.metered.ca:80",
                },
                {
                  urls: "turn:a.relay.metered.ca:80",
                  username: "9fe8000ce00f61b6860c1207",
                  credential: "IqHJW0a/5rviX05A",
                },
                {
                  urls: "turn:a.relay.metered.ca:80?transport=tcp",
                  username: "9fe8000ce00f61b6860c1207",
                  credential: "IqHJW0a/5rviX05A",
                },
                {
                  urls: "turn:a.relay.metered.ca:443",
                  username: "9fe8000ce00f61b6860c1207",
                  credential: "IqHJW0a/5rviX05A",
                },
                {
                  urls: "turn:a.relay.metered.ca:443?transport=tcp",
                  username: "9fe8000ce00f61b6860c1207",
                  credential: "IqHJW0a/5rviX05A",
                },
            ]
        };
    },

    replaceTrack( stream, recipientPeer ) {
        let sender = recipientPeer.getSenders ? recipientPeer.getSenders().find( s => s.track && s.track.kind === stream.kind ) : false;

        sender ? sender.replaceTrack( stream ) : '';
    },

    toggleShareIcons( share ) {
        let shareIconElem = $('#share-screen');

        if ( share ) {
            shareIconElem.attr( 'title', 'Stop sharing screen' );
            shareIconElem[0].classList.add( 'text-primary' );
            shareIconElem[0].classList.remove( 'text-white' );
        } else {
            shareIconElem.attr( 'title', 'Share screen' );
            shareIconElem[0].classList.add( 'text-white' );
            shareIconElem[0].classList.remove( 'text-primary' );
        }
    },

    toggleVideoBtnDisabled( disabled ) {
        $('#toggle-video').disabled = disabled;
    },

    maximiseStream( e ) {
        let elem = e.target.parentElement.previousElementSibling;

        elem.requestFullscreen() || elem.mozRequestFullScreen() || elem.webkitRequestFullscreen() || elem.msRequestFullscreen();
    },

    singleStreamToggleMute( e ) {
        if ( e.target.classList.contains( 'fa-microphone' ) ) {
            e.target.parentElement.previousElementSibling.muted = true;
            e.target.classList.add( 'fa-microphone-slash' );
            e.target.classList.remove( 'fa-microphone' );
        }

        else {
            e.target.parentElement.previousElementSibling.muted = false;
            e.target.classList.add( 'fa-microphone' );
            e.target.classList.remove( 'fa-microphone-slash' );
        }
    },

    saveRecordedStream( stream, user ) {
        let blob = new Blob( stream, { type: 'video/webm' } );

        let file = new File( [blob], `${ user }-${ moment().unix() }-record.webm` );

        saveAs( file );
    },

    toggleModal( id, show ) {
        let el = document.getElementById( id );

        if ( show ) {
            el.style.display = 'block';
            el.removeAttribute( 'aria-hidden' );
        }

        else {
            el.style.display = 'none';
            el.setAttribute( 'aria-hidden', true );
        }
    },

    setLocalStream( stream, mirrorMode = true , triggerByClick = false) {
        const localVidElem = $( '#local' ),
            allUrlParams = this.getAllUrlParams(),
            callingType = allUrlParams['callingType'] ?? ''
            
        localVidElem[0].srcObject = stream;
        mirrorMode ? localVidElem.addClass( 'mirror-mode' ) : localVidElem.removeClass( 'mirror-mode' );

        if (!triggerByClick) {
            this.toggleShowVideo(callingType, stream)
        }
    },

    adjustVideoElemSize() {
        let cardElms = $('.card');
        let totalRemoteVideosDesktop = cardElms.length;
        let newWidth = totalRemoteVideosDesktop <= 2 ? '50%' : (
            totalRemoteVideosDesktop == 3 ? '33.33%' : (
                totalRemoteVideosDesktop <= 8 ? '25%' : (
                    totalRemoteVideosDesktop <= 15 ? '20%' : (
                        totalRemoteVideosDesktop <= 18 ? '16%' : (
                            totalRemoteVideosDesktop <= 23 ? '15%' : (
                                totalRemoteVideosDesktop <= 32 ? '12%' : '10%'
                            )
                        )
                    )
                )
            )
        );

        cardElms.css('width', newWidth);
    },

    addRemoteVideo(stream, partnerName) {
        if ( $(`#${partnerName}-video`).length) {
            $(`#${partnerName}-video`)[0].srcObject = stream;
        } else {
            //video elem
            let newVid = $('<video></video>');
            newVid.attr('id', `${partnerName}-video`);
            newVid[0].srcObject = stream;
            newVid.attr('autoplay', true);
            newVid.attr('playsinline', true)
            newVid.addClass('remote-video');

            //video controls elements
            let controlDiv = $('<div></div>');
            controlDiv.addClass('remote-video-controls');
            controlDiv.html(`<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
            <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`);

            //create a new div for card
            let cardDiv = $('<div></div>');
            cardDiv.addClass('card card-sm');
            cardDiv.attr('id', partnerName);
            cardDiv.append( newVid );
            cardDiv.append( controlDiv );

            //put div in main-section elem
            $('#videos').append(cardDiv);

            this.adjustVideoElemSize();
        }
    },

    // add only one video of sender (video call between 2 people)
    addAllRemoteVideosExcept(senderPeer, name) {
        senderPeer.getRemoteStreams().forEach( (stream) => {
            this.addRemoteVideo(stream, name)
        })
    },

    scrollToBottom(isSendTextMessage = false, loadedImg = 0) {
        let images = messagesElm.find("img")
        
        images.on("load", function() {
            loadedImg++
            if (loadedImg == images.length) {
                messagesElm.animate({ scrollTop: messagesElm[0].scrollHeight }, 1500, 'swing')
            }
        })

        images.on("error", function() {
            loadedImg++
            if (loadedImg == images.length) {
                messagesElm.animate({ scrollTop: messagesElm[0].scrollHeight }, 1500, 'swing')
            }
        })

        if (images.length === 0 || isSendTextMessage) {
            messagesElm.animate({ scrollTop: messagesElm[0].scrollHeight }, 1500, 'swing')
        }

        this.updateButtonVisibility()
    },

    reactMessage(messageId, reaction) {
        socket.emit('reactMessage', { messageId, reaction });

        // todo: process save react icon in db
    },

    generateElementId(name, id) {
        return `${name}-${id}`
    },

    getMessageIdFromElementId(name, elementId) {
        return elementId.substring(elementId.indexOf(name) + name.length)
    },

    deleteMessage (lineMessageId) {
        let messageTextDeleted = `<div class='line-message' id=${lineMessageId}><p class='message deleted'>This message was deleted!</p></div>`
        $(`#${lineMessageId}`).replaceWith(messageTextDeleted)

        // todo: process delete message in db
    },

    urlBase64ToUint8Array(base64String) {
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
    },

    hideAllCallingNotification() {
        let ringtone = $('#ringtone')

        ringtone[0].pause()
        $('.chat__callnotification').hide()
        $('#calling-notification').hide()
        $('#incomming-call-notification').hide()
    },

    addTriggerMessageActions (id) {
        let self = this,
            lineMessageId = this.generateElementId('message', id),
            messageId = this.generateElementId('message__container', id),
            actionBoxId = this.generateElementId('message__action', id),
            buttonReactionId = this.generateElementId('message__reactionbutton', id),
            reactionIconList = this.generateElementId('message__reactionlist', id),
            moreId = this.generateElementId('message__morebutton', id),
            moreDropdownListId = this.generateElementId('message__dropdownlist', id),
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
            self.deleteMessage(lineMessageId)
            isShowMoreDropdownList = false
        })

        $(`#${moreDropdownListId} .edit`).on("click", function () {
            moreButtonElement.hide()
            lineMessageElement.css('background-color', '#FFF6D6')
            $("#message").val(messageContentElement.text()).css('background-color', '#FFF6D6')
            editMessageId = self.getMessageIdFromElementId('message__container-', messageId)
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
            let messageId = self.getMessageIdFromElementId('message__reactionlist-', reactionIconList)
            self.reactMessage(messageId, $(this).attr("data-title").toLowerCase())
        })
    },

    toggleShowVideo(type, stream) {
        if (type === 'audio-call') {
            let elem = $('#toggle-video')

            elem.removeClass( 'fa-video' )
            elem.addClass( 'fa-video-slash' )
            elem.attr( 'title', 'Show Video' )

            stream.getVideoTracks()[0].enabled = false

            this.setLocalStream( stream, true , true);
        }
    },

    getAllUrlParams() {
        let url = new URL(window.location.href),
            params = url.searchParams,
            result = []

        params.forEach((value, key) => {
            result[key] = value
        })

        return result;
    },

    broadcastNewTracks( stream, type, mirrorMode = true ) {
        this.setLocalStream( stream, mirrorMode , true);

        let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

        for ( let p in pc ) {
            let pName = pc[p];

            if ( typeof pc[pName] == 'object' ) {
                this.replaceTrack( track, pc[pName] );
            }
        }
    },

    addScrollToBottomButton() {
        let self = this

        scrollToBottomButton.on("click", () => {
            self.scrollToBottom(true)
        })

        messagesElm.scroll(() => {
            self.updateButtonVisibility()
        })
    
        self.updateButtonVisibility()
    },

    isScrolledToBottom() {
        return messagesElm[0].scrollHeight - messagesElm[0].scrollTop <= 2*messagesElm[0].clientHeight + 10;
    },

    updateButtonVisibility() {
        scrollToBottomButton.toggle(!this.isScrolledToBottom())
    },

    logout() {
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
    }
};