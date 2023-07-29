import helpers from './helpers.js';

$(window).on( 'load', () => {
    //When the video frame is clicked. This will enable picture-in-picture
    // document.getElementById( 'local' ).addEventListener( 'click', () => {
    //     if ( !document.pictureInPictureElement ) {
    //         document.getElementById( 'local' ).requestPictureInPicture()
    //             .catch( error => {
    //                 console.error( error );
    //             } );
    //     } else {
    //         document.exitPictureInPicture()
    //             .catch( error => {
    //                 console.error( error );
    //             } );
    //     }
    // } );

    $(document).on( 'click', ( e ) => {
        if ( e.target && e.target.classList.contains( 'expand-remote-video' ) ) {
            helpers.maximiseStream( e );
        } else if ( e.target && e.target.classList.contains( 'mute-remote-mic' ) ) {
            helpers.singleStreamToggleMute( e );
        }
    } );

    $(document).on( 'click', '#closeModal', () => {
        helpers.toggleModal( 'recording-options-modal', false );
    })
} );