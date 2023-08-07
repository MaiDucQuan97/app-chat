import h from './helpers.js';

$(window).on( 'load', () => {
    $('.room-comm').removeAttr( 'hidden' );

    const maxReconnectAttempts = 5;

    var reconnectAttempts = 0;
    var socket = io();
    var allUrlParams = h.getAllUrlParams(),
        toUserId = allUrlParams['toUserId'] ?? '',
        currentUserId = allUrlParams['fromUserId'] ?? '',
        myStream = '',
        screen = '',
        recordedStream = [],
        mediaRecorder = '';

    const room = h.createUniqueString(currentUserId, toUserId)

    //Get user video by default
    getAndSetUserStream();

    socket.on( 'connect', () => {
        socket.emit( 'subscribeVideoCall', {
            room: room,
            toId: toUserId,
            socketId: currentUserId
        } );

        socket.on( 'newUser', ( data ) => {
            socket.emit( 'newUserStart', { to: data.socketId, sender: currentUserId } );
            h.pc.push( data.socketId );
            init( true, data.socketId );
        } );

        socket.on( 'newUserStart', ( data ) => {
            h.pc.push( data.sender );
            init( false, data.sender );
        } );

        socket.on( 'iceCandidates', async ( data ) => {
            data.candidate ? await h.pc[data.sender].addIceCandidate( new RTCIceCandidate( data.candidate ) ) : '';
        } );

        socket.on( 'sdp', async ( data ) => {
            if ( data.description.type === 'offer' ) {
                data.description ? await h.pc[data.sender].setRemoteDescription( new RTCSessionDescription( data.description ) ) : '';

                h.getUserFullMedia().then( async ( stream ) => {
                    if ( !$('#local').srcObject ) {
                        h.setLocalStream( stream );
                    }

                    //save my stream
                    myStream = stream;

                    stream.getTracks().forEach( ( track ) => {
                        h.pc[data.sender].addTrack( track, stream );
                    } );

                    let answer = await h.pc[data.sender].createAnswer();

                    await h.pc[data.sender].setLocalDescription( answer );

                    socket.emit( 'sdp', { description: h.pc[data.sender].localDescription, to: data.sender, sender: currentUserId } );
                } ).catch( ( e ) => {
                    console.error( e );
                } );
            } else if ( data.description.type === 'answer' ) {
                await h.pc[data.sender].setRemoteDescription( new RTCSessionDescription( data.description ) );
            }
        } );
    } );

    function getAndSetUserStream() {
        h.getUserFullMedia().then( ( stream ) => {
            myStream = stream;

            h.setLocalStream( stream );
        } ).catch( ( e ) => {
            console.error( `stream error: ${ e }` );
        } );
    }

    async function init( createOffer, partnerName, isReconnect = false) {
        if (isReconnect) {
            h.pc[partnerName].close()
        }

        h.pc[partnerName] = new RTCPeerConnection( h.getIceServer() );

        if ( screen && screen.getTracks().length ) {
            screen.getTracks().forEach( ( track ) => {
                h.pc[partnerName].addTrack( track, screen );
            } );
        } else if ( myStream ) {
            myStream.getTracks().forEach( ( track ) => {
                h.pc[partnerName].addTrack( track, myStream );
            } );
        } else {
            await h.getUserFullMedia().then( ( stream ) => {
                myStream = stream;

                stream.getTracks().forEach( ( track ) => {
                    h.pc[partnerName].addTrack( track, stream );
                } );

                h.setLocalStream( stream );
            } ).catch( ( e ) => {
                console.error( `stream error: ${ e }` );
            } );
        }

        h.addAllRemoteVideosExcept(h.pc[partnerName], toUserId)

        //create offer
        if ( createOffer ) {
            h.pc[partnerName].onnegotiationneeded = async () => {
                const offerOptions = {
                    offerToReceiveAudio: true, // Preserve the order of audio m-line
                    offerToReceiveVideo: true, // Preserve the order of video m-line
                };

                let offer = await h.pc[partnerName].createOffer(offerOptions);

                await h.pc[partnerName].setLocalDescription( offer );

                socket.emit( 'sdp', { description: h.pc[partnerName].localDescription, to: partnerName, sender: currentUserId } );
            };
        }

        //send ice candidate to partnerNames
        h.pc[partnerName].onicecandidate = ( { candidate } ) => {
            socket.emit( 'iceCandidates', { candidate: candidate, to: partnerName, sender: currentUserId } );
        };

        //add
        h.pc[partnerName].ontrack = ( e ) => {
            h.addRemoteVideo(e.streams[0], partnerName)
        };

        h.pc[partnerName].onconnectionstatechange = ( d ) => {
            switch ( h.pc[partnerName].iceConnectionState ) {
                case 'disconnected':
                    h.closeVideo( partnerName );
                    break;
                case 'failed':
                    if (reconnectAttempts < maxReconnectAttempts) {
                        reconnectAttempts++;
                        setTimeout(() => init(createOffer, partnerName, true), 3000);
                    } else {
                        console.log('Max reconnection attempts reached. Failed to reconnect.');
                        h.closeVideo( partnerName );
                    }
                    break;

                case 'closed':
                    h.closeVideo( partnerName );
                    break;
            }
        };

        h.pc[partnerName].onsignalingstatechange = ( d ) => {
            switch ( h.pc[partnerName].signalingState ) {
                case 'closed':
                    console.log( "Signalling state is 'closed'" );
                    h.closeVideo( partnerName );
                    break;
            }
        };
    }

    function shareScreen() {
        h.shareScreen().then( ( stream ) => {
            h.toggleShareIcons( true );

            //disable the video toggle btns while sharing screen. This is to ensure clicking on the btn does not interfere with the screen sharing
            //It will be enabled was user stopped sharing screen
            h.toggleVideoBtnDisabled( true );

            //save my screen stream
            screen = stream;

            //share the new stream with all partners
            h.broadcastNewTracks( stream, 'video', false );

            //When the stop sharing button shown by the browser is clicked
            $(screen.getVideoTracks()[0]).on( 'ended', () => {
                stopSharingScreen();
            } );
        } ).catch( ( e ) => {
            console.error( e );
        } );
    }

    function stopSharingScreen() {
        //enable video toggle btn
        h.toggleVideoBtnDisabled( false );

        return new Promise( ( res, rej ) => {
            screen.getTracks().length ? screen.getTracks().forEach( track => track.stop() ) : '';

            res();
        } ).then( () => {
            h.toggleShareIcons( false );
            h.broadcastNewTracks( myStream, 'video' );
        } ).catch( ( e ) => {
            console.error( e );
        } );
    }

    function toggleRecordingIcons( isRecording ) {
        let e = $('#record');

        if ( isRecording ) {
            e.attr( 'title', 'Stop recording' );
            e[0].classList.add( 'text-danger' );
            e[0].classList.remove( 'text-white' );
        }

        else {
            e.attr( 'title', 'Record' );
            e[0].classList.add( 'text-white' );
            e[0].classList.remove( 'text-danger' );
        }
    }

    function startRecording( stream ) {
        mediaRecorder = new MediaRecorder( stream, {
            mimeType: 'video/webm;codecs=vp9'
        } );

        mediaRecorder.start( 1000 );
        toggleRecordingIcons( true );

        mediaRecorder.ondataavailable = function ( e ) {
            recordedStream.push( e.data );
        };

        mediaRecorder.onstop = function () {
            toggleRecordingIcons( false );

            h.saveRecordedStream( recordedStream, currentUserId );

            setTimeout( () => {
                recordedStream = [];
            }, 3000 );
        };

        mediaRecorder.onerror = function ( e ) {
            console.error( e );
        };
    }

    $('#toggle-video').on( 'click', ( e ) => {
        e.preventDefault();

        let elem = $(e.currentTarget)

        if ( myStream.getVideoTracks()[0].enabled ) {
            elem.removeClass( 'fa-video' );
            elem.addClass( 'fa-video-slash' );
            elem.attr( 'title', 'Show Video' );

            myStream.getVideoTracks()[0].enabled = false;
        } else {
            elem.removeClass( 'fa-video-slash' );
            elem.addClass( 'fa-video' );
            elem.attr( 'title', 'Hide Video' );

            myStream.getVideoTracks()[0].enabled = true;
        }

        h.broadcastNewTracks( myStream, 'video' );
    } );

    $('#toggle-mute').on( 'click', ( e ) => {
        e.preventDefault();

        let elem = $(this);

        if ( myStream.getAudioTracks()[0].enabled ) {
            e.target.classList.remove( 'fa-microphone-alt' );
            e.target.classList.add( 'fa-microphone-alt-slash' );
            elem.attr( 'title', 'Unmute' );

            myStream.getAudioTracks()[0].enabled = false;
        } else {
            e.target.classList.remove( 'fa-microphone-alt-slash' );
            e.target.classList.add( 'fa-microphone-alt' );
            elem.attr( 'title', 'Mute' );

            myStream.getAudioTracks()[0].enabled = true;
        }

        h.broadcastNewTracks( myStream, 'audio' );
    } );

    $('#share-screen').on( 'click', ( e ) => {
        e.preventDefault();

        if ( screen && screen.getVideoTracks().length && screen.getVideoTracks()[0].readyState != 'ended' ) {
            stopSharingScreen();
        } else {
            shareScreen();
        }
    } );

    $('#record').on( 'click', ( e ) => {
        if ( !mediaRecorder || mediaRecorder.state == 'inactive' ) {
            h.toggleModal( 'recording-options-modal', true );
        } else if ( mediaRecorder.state == 'paused' ) {
            mediaRecorder.resume();
        } else if ( mediaRecorder.state == 'recording' ) {
            mediaRecorder.stop();
        }
    } );

    $('#record-screen').on( 'click', () => {
        h.toggleModal( 'recording-options-modal', false );

        if ( screen && screen.getVideoTracks().length ) {
            startRecording( screen );
        } else {
            h.shareScreen().then( ( screenStream ) => {
                startRecording( screenStream );
            } ).catch( () => { } );
        }
    } );

    $('#record-video').on( 'click', () => {
        h.toggleModal( 'recording-options-modal', false );

        if ( myStream && myStream.getTracks().length ) {
            startRecording( myStream );
        } else {
            h.getUserFullMedia().then( ( videoStream ) => {
                startRecording( videoStream );
            } ).catch( () => { } );
        }
    } );
} );