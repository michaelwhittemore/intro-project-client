// Handling all of our errors here by alerting them
function handleError(error) {
    if (error) {
        alert(error.message);
    }
}

const SERVER_BASE_URL = 'https://intro-project.herokuapp.com';
//const SERVER_BASE_URL = "http://localhost:3000" //Remove this later, use for testing
let archiveToggle = false; // it seems like there is no way to get the
let broadcastToggle = false;
// status of the archive directly from the session??? so i'm 
// using a toggle instead of having to query the server
window.onload = () => {
    //check if we already have a userId, if not ping the server to set up a user
    if (sessionStorage.getItem('userId') === null) {
        document.getElementById("connected").innerText = "Setting up new user..."
        fetch(SERVER_BASE_URL + '/newUser').then(res => {
            return res.json()
        }).then(res => {
            console.log('sucessfully got id and role:', res)
            sessionStorage.setItem('userId', res['userId'])
            sessionStorage.setItem('userRole', res['userRole'])
            setUser()
        })
    } else {
        setUser()
    }
    //enter the video queue
    document.getElementById("start-video").onclick = () => {
        console.log('looking for vid')
        // make call to sever adding to the queue and starting a session
        addToVideoQueue(sessionStorage.getItem('userId'), sessionStorage.getItem('userRole'))
    }

}

function addToVideoQueue(Id, role) {
    let body = JSON.stringify({ userId: Id, userRole: role })
    console.log('sending ' + body)
    appendMessage('Entering the video', 'alert-message');
    fetch(SERVER_BASE_URL + '/queue',
        {
            method: 'POST',
            body: body,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(async (res) => {
            let resJson = await res.json()
            apiKey = resJson.apiKey;
            console.log(resJson)
            sessionId = resJson.sessionId;
            token = resJson.token;
            initializeSession(apiKey, sessionId);
        }).catch(handleError);
}
function chatButtonBuilder(session) {
    session.on('signal:message', event => {
        // not from us
        if (session.connection && event.from.connectionId != session.connection.id) {
            let incomingMessage = event.data;
            console.log("incomingMessage: " + incomingMessage)
            appendMessage(incomingMessage, 'incoming-message')
        }
    })
    document.getElementById("submit-chat").onclick = () => {
        let outgoingMessage = document.getElementById("chat-form").value;
        document.getElementById("chat-form").value = '';
        console.log('outgoingMessage:', outgoingMessage)
        session.signal({
            type: 'message',
            data: outgoingMessage
        }, handleError)
        appendMessage(outgoingMessage, 'outgoing-message');
    }
    // let you submit via return
    document.addEventListener('keydown', (event => {
        if (event.keyCode === 13) {
            document.getElementById('submit-chat').click()
        }
    }))
}
//attch a message to the chat area with relevant styling
//either 'incoming-message','outgoing-message','alert-message'
function appendMessage(message, style) {
    let messageElement = document.createElement('div')
    messageElement.innerText = message
    messageElement.setAttribute('class', style)
    document.getElementById("text-chat-area").append(messageElement)
}
// ties broadcast button to session
function broadcastButtonBuilder(sessionId) {
    document.getElementById('broadcast-video').onclick = async () => {
        if (!broadcastToggle) {
            const broadcast = await fetch(SERVER_BASE_URL + '/start-broadcast',
                {
                    method: 'POST',
                    body: JSON.stringify({ sessionId: sessionId }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            const broadcastJSON = await broadcast.json();
            document.getElementById('url-area').innerText = broadcastJSON.broadcastUrls.hls + ' Click here to copy'
            appendMessage('Now broadcasting', 'alert-message')
            broadcastToggle = true;
            document.getElementById('broadcast-video').innerText = 'Stop Broadcast'
            // copy to clickboard
            document.getElementById('url-area').onclick = () => {
                let hidden = document.createElement('textarea');
                hidden.value = broadcastJSON.broadcastUrls.hls;
                hidden.setAttribute('readonly', '');
                hidden.style = { position: 'absolute', left: '-9999px' };
                document.body.appendChild(hidden);
                hidden.select();
                document.execCommand('copy');
                document.body.removeChild(hidden);
                alert('copied to clipboard')
            }
        } else if (broadcastToggle) {
            console.log('stopping broadcast')
            const stopBroadcast = await fetch(SERVER_BASE_URL + '/stop-broadcast',
                {
                    method: 'POST',
                    body: JSON.stringify({ sessionId: sessionId }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            console.log(stopBroadcast);
            document.getElementById('url-area').innerText = 'Your hls url will appear here when you broadcast'
            broadcastToggle = false;
            appendMessage('Stopped broadcasting', 'alert-message')
            document.getElementById('broadcast-video').innerText = 'Start Broadcast'
        }
    }
}
// ties the button to the sessionId
function archiveButtonBuilder(sessionId) {
    document.getElementById('archive-video').onclick = () => {
        if (!archiveToggle) { // no current archive
            console.log('sessionId for starting archive', sessionId)
            fetch(SERVER_BASE_URL + '/start-archive',
                {
                    method: 'POST',
                    body: JSON.stringify({ sessionId: sessionId }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ).then(async res => {
                let resJson = await res.json();
                console.log('start response:', resJson)
                appendMessage(`Starting Archive, archive file name will be ${resJson.id.split('-')[0]}`, 'alert-message');
            })
        } else if (archiveToggle) {
            archiveStopper(sessionId)
        }
    }
}
function archiveStopper(sessionId) {
    fetch(SERVER_BASE_URL + '/stop-archive',
        {
            method: 'POST',
            body: JSON.stringify({ sessionId: sessionId }),
            headers: {
                'Content-Type': 'application/json'
            }
        }
    ).then(res => {
        console.log('archive stop response', res.body)
    })
    document.getElementById('archive-video').innerText = 'Start Archiving'
    archiveToggle = false;
}
//sets up a newuser from session storage
function setUser() {
    document.getElementById("start-video").disabled = false;
    document.getElementById("connected").innerText = `User Id: ${sessionStorage.getItem('userId')} \nUser Role: ${sessionStorage.getItem('userRole')}`
}
//updates the buttons, should be called whenever we connect to a new session
function newSessionButtons(session) {
    document.getElementById("start-video").disabled = true;
    document.getElementById("disconnect-video").disabled = false;
    document.getElementById('screen-share').disabled = false;
    document.getElementById('archive-video').disabled = false;
    document.getElementById('broadcast-video').disabled = false;
    document.getElementById("disconnect-video").onclick = () => {
        session.disconnect();
    }
    chatButtonBuilder(session);
    archiveButtonBuilder(session.sessionId)
    broadcastButtonBuilder(session.sessionId)
}
function noSessionButtons() {
    console.log('noSessionButtons called')
    document.getElementById('start-video').disabled = false;
    document.getElementById('disconnect-video').disabled = true;
    document.getElementById('screen-share').disabled = true;
    document.getElementById('archive-video').disabled = true;
    document.getElementById('broadcast-video').disabled = true;


}

function initializeSession(apiKey, sessionId) {
    // toggle for screen sharing
    let screenShare = false;
    let webCamPublisher;
    let screenSharePublisher
    console.log(apiKey, sessionId)
    var session = OT.initSession(apiKey, sessionId);

    // Subscribe to a newly created stream
    session.on('streamCreated', function (event) {
        console.log(' stream created ')
        session.subscribe(event.stream, 'subscriber', {
            insertMode: 'append',
            width: '100%',
            height: '100%'
        }, handleError);
    });

    // Create a publisher (for the webcam by default)
    webCamPublisher = OT.initPublisher('publisher', {
        insertMode: 'append',
        width: '100%',
        height: '100%'
    }, handleError);

    // Connect to the session
    session.connect(token, function (error) {
        // If the connection is successful, initialize a publisher and publish to the session
        if (error) {
            handleError(error);
        } else {
            session.publish(webCamPublisher, handleError);
            newSessionButtons(session);
        }
    });

    // when another disconnects
    session.on('connectionDestroyed', function (event) {
        console.log('connection destroyed. logging event: ', event)
        session.disconnect()

    })
    // when YOU disconnect
    session.on('sessionDisconnected', function (event) {
        console.log('session disconnected. logging event: ', event)
        fetch(SERVER_BASE_URL + '/remove-from-queue', {
            method: 'DELETE',
            body: JSON.stringify({ userId: sessionStorage.getItem('userId') }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).catch(handleError)
        noSessionButtons();
        archiveStopper(session.sessionId)
        appendMessage('Video chat ended', 'alert-message');

    })
    // publisher to the session via screen sharing 
    document.getElementById("screen-share").onclick = () => {
        if (!screenShare) {
            screenSharePublisher = OT.initPublisher('publisher',
                {
                    videoSource: 'screen',
                    insertMode: 'append',
                    width: '100%',
                    height: '100%'
                }, handleError
            )
            session.unpublish(webCamPublisher)
            session.publish(screenSharePublisher, handleError);
            screenShare = true;
            appendMessage('Screen share enabled', 'alert-message');
        } else if (screenShare) {
            webCamPublisher = OT.initPublisher('publisher', {
                insertMode: 'append',
                width: '100%',
                height: '100%'
            }, handleError);
            session.unpublish(screenSharePublisher)
            session.publish(webCamPublisher, handleError);
            screenShare = false;
            appendMessage('Sceen share disabled', 'alert-message');
        }
    }
    session.on('streamDestroyed', (event) => {
        console.log('stream destroyed: ' + event);
    })
    session.on('archiveStarted', event => {
        console.log('archive started:', event)
        document.getElementById('archive-video').innerText = 'Stop Archiving'
        archiveToggle = true;
    })
    session.on('archiveStopped', event => {
        console.log('archive stopped:', event)
        appendMessage('Archive stopped', 'alert-message');
        //this behavior is either triggered by us disconnecting from the
        //session or the archive, the listener doesn't seem to work once we
        //disconnect from the session
        document.getElementById('archive-video').innerText = 'Start Archiving'
        archiveToggle = false;
    })
}