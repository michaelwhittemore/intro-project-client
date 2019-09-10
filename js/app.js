// // replace these values with those generated in your TokBox Account
// var apiKey = "46418002";
// var sessionId = "1_MX40NjQxODAwMn5-MTU2ODA2NjE4NzYwM356RVBkYWlyUkVESWMwUU5SRXdZY2NPcS9-fg";
// var token = "T1==cGFydG5lcl9pZD00NjQxODAwMiZzaWc9YjE5NWNiOTJjOTdhMjI5ZmI4NTI1NTYxNGNmNjM5MWMzNzliMmFjODpzZXNzaW9uX2lkPTFfTVg0ME5qUXhPREF3TW41LU1UVTJPREEyTmpFNE56WXdNMzU2UlZCa1lXbHlVa1ZFU1dNd1VVNVNSWGRaWTJOUGNTOS1mZyZjcmVhdGVfdGltZT0xNTY4MDY2OTgyJm5vbmNlPTAuMTAwOTU0NzE2MjU4NTQ3OCZyb2xlPXB1Ymxpc2hlciZleHBpcmVfdGltZT0xNTcwNjU4OTgyJmluaXRpYWxfbGF5b3V0X2NsYXNzX2xpc3Q9";


// Handling all of our errors here by alerting them
function handleError(error) {
    if (error) {
        alert(error.message);
    }
}

var SERVER_BASE_URL = 'https://intro-project.herokuapp.com';
window.onload = () => {
    //check if we already have a userID, if not ping the server to set up a user
    if (sessionStorage.getItem('userID') === null) {
        console.log("No userID in storage")
        document.getElementById("connected").innerText = "No userID in storage"
    }
}
console.log("ask server for credentials")
fetch(SERVER_BASE_URL + '/session').then(function (res) {
    return res.json()
}).then(function (res) {
    apiKey = res.apiKey;
    console.log(res)
    sessionId = res.sessionId;
    token = res.token;
    initializeSession();
}).catch(handleError);



function initializeSession() {
    var session = OT.initSession(apiKey, sessionId);

    // Subscribe to a newly created stream
    session.on('streamCreated', function (event) {
        session.subscribe(event.stream, 'subscriber', {
            insertMode: 'append',
            width: '100%',
            height: '100%'
        }, handleError);
    });

    // Create a publisher
    var publisher = OT.initPublisher('publisher', {
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
            session.publish(publisher, handleError);
        }
    });
}
