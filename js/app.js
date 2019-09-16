// Handling all of our errors here by alerting them
function handleError(error) {
    if (error) {
        alert(error.message);
    }
}

//var SERVER_BASE_URL = 'https://intro-project.herokuapp.com';
var SERVER_BASE_URL = "http://localhost:3000" //Remove this later, use for testing
window.onload = () => {
    //check if we already have a userId, if not ping the server to set up a user
    if (sessionStorage.getItem('userId') === null) {
        document.getElementById("connected").innerText = "Setting up new user..."
        fetch(SERVER_BASE_URL + '/newUser').then(res => {
            return res.json()
        }).then(res => {
            console.log(res)
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
function chatButtonBuilder (){
    
}
//sets up a newuser from session storage
function setUser() {
    document.getElementById("start-video").disabled = false;
    document.getElementById("connected").innerText = `User Id (for troubleshooting): ${sessionStorage.getItem('userId')} \nUser Role: ${sessionStorage.getItem('userRole')}`
}
//updates the buttons, should be called whenever we connect to a new session
function newSessionButtons(session) {
    document.getElementById("start-video").disabled = true;
    document.getElementById("disconnect-video").disabled = false;
    document.getElementById('screen-share').disabled = false;
    document.getElementById("disconnect-video").onclick = () => {
        session.disconnect();
    }
}
function noSessionButtons() {
    console.log('noSessionButtons called')
    document.getElementById('start-video').disabled = false;
    document.getElementById('disconnect-video').disabled = true;
    document.getElementById('screen-share').disabled = true;
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
        // set up chat area when session is connected

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
    })
    //TODO CURRENTLY JUST TESTING - IDEALLY WE SHOULD SWITCH BETWEEN 
    //SCREEN SHARING AND WEBCAM
    //START BY TRYING A NEW PUBLISHER??
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
            screenShare=true;
        } else if (screenShare) {
            webCamPublisher = OT.initPublisher('publisher', {
                insertMode: 'append',
                width: '100%',
                height: '100%'
            }, handleError);
            session.unpublish(screenSharePublisher)
            session.publish(webCamPublisher, handleError);
            screenShare=false;
        }
    }
    session.on('streamDestroyed', (event) => {
        console.log('stream destroyed: ' + event);
    })

}




//start a video feed
// fetch(SERVER_BASE_URL + '/session').then(function (res) {
//     return res.json()
// }).then(function (res) {
//     apiKey = res.apiKey;
//     console.log(res)
//     sessionId = res.sessionId;
//     token = res.token;
//     initializeSession();
// }).catch(handleError);