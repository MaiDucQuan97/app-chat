export default {
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

    setLocalStream( stream, mirrorMode = true ) {
        const localVidElem = $( '#local' );

        localVidElem[0].srcObject = stream;
        mirrorMode ? localVidElem.addClass( 'mirror-mode' ) : localVidElem.removeClass( 'mirror-mode' );
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
    }
};