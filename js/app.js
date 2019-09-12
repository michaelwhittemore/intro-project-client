
// Handling all of our errors here by alerting them
function handleError(error) {
    if (error) {
        alert(error.message);
    }
}

var SERVER_BASE_URL = 'https://intro-project.herokuapp.com';
//var SERVER_BASE_URL="localhost:3000" //Remove this later, use for testing
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
        console.log('look for vid')
        //TODO make call to sever adding to the queue and starting a session
        addToVideoQueue(sessionStorage.getItem('userId'), sessionStorage.getItem('userRole'))
    }

}
function addToVideoQueue(Id, role) {
    console.log('sending ' + JSON.stringify({ userId: Id, userRole: role }))
    fetch(SERVER_BASE_URL + '/queue', {
        mode:'cors',
        method: 'POST',
        body: JSON.stringify({ userId: Id, userRole: role })
    }).then(res => {
        apiKey = res.apiKey;
        console.log(res)
        sessionId = res.sessionId;
        token = res.token;
        initializeSession();
    }).catch(handleError);
}

//sets up a newuser from session storage
function setUser() {
    document.getElementById("start-video").disabled = false;
    document.getElementById("connected").innerText = `User Id (for troubleshooting): ${sessionStorage.getItem('userId')} \nUser Role: ${sessionStorage.getItem('userRole')}`
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



function initializeSession() {
    var session = OT.initSession(apiKey, sessionId);

    // Subscribe to a newly created stream
    session.on('streamCreated', function (event) {
        session.subscribe(event.stream, 'subscriber', {
            insertMode: 'append',
            wIdth: '100%',
            height: '100%'
        }, handleError);
    });

    // Create a publisher
    var publisher = OT.initPublisher('publisher', {
        insertMode: 'append',
        wIdth: '100%',
        height: '100%'
    }, handleError);

    // Connect to the session
    session.connect(token, function (error) {
        // If the connection is successful, initialize a publisher and publish to the session
        if (error) {
            handleError(error);
        } else {
            session.publish(publisher, handleError);
        }
    });
}
