var STRINGEE_SERVER_ADDRS;
var stringeeClient;
var getTokenUrl;

var call;
var holdState = false;


STRINGEE_SERVER_ADDRS = ['wss://v1.stringee.com:6899/', 'wss://v2.stringee.com:6899/'];
getTokenUrl = '.php/token_pro.php';


$(document).ready(function () {
    $('#sdkVersion').html(StringeeUtil.version().version + '_build_' + StringeeUtil.version().build 
            + '_sample_1');
});

function switchCamera() {
    
    
    call.switchCamera();
}

function shareScreen() {
    call.startShareScreen();
}

function sendInfo(msg) {
    call.sendInfo(msg, function (res) {
        console.log('sendInfo res', res);
    });
}

function testLogin() {
    stringeeClient = new StringeeClient(STRINGEE_SERVER_ADDRS);
    settingsClientEvents(stringeeClient);
    var access_token = "eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTSy4wLlo0Q3dJZmJrdk1SMktnNERsb0ZpQnNsQ0ZpT09Sc0tjLTE3NDcxODY0OTciLCJpc3MiOiJTSy4wLlo0Q3dJZmJrdk1SMktnNERsb0ZpQnNsQ0ZpT09Sc0tjIiwiZXhwIjoxNzQ5Nzc4NDk3LCJ1c2VySWQiOiJzdGFmZjAwMSIsImljY19hcGkiOnRydWV9.uHVEcsuYQ5QbwYLMcwm4ZyjC8XO_fp6Muj0eqqu0pL0"; // dán token thật ở đây
stringeeClient.connect(access_token);

}

function settingsClientEvents(client) {
    client.on('authen', function (res) {
        console.log('on authen: ', res);
        if (res.r === 0) {
            $('#loggedUserId').html(res.userId);
            $('#loggedUserId').css('color', 'blue');
            $('#loginBtn').attr('disabled', 'disabled');

            $('#call2Btn').removeAttr('disabled');
            $('#call2HangupBtn').removeAttr('disabled');
            $('#muteBtn').removeAttr('disabled');
            $('#enableVideoBtn').removeAttr('disabled');
        }
    });
    client.on('connect', function () {
        console.log('++++++++++++++ connected');
    });
    client.on('disconnect', function () {
        console.log('++++++++++++++ disconnected');
    });
    client.on('requestnewtoken', function () {
        console.log('++++++++++++++ requestnewtoken+++++++++');
    });
    client.on('incomingcall2', function (call2) {
        console.log('📞 Web received incomingcall2 from:', call2.from);
        call = call2;
        settingCallEvent(call);

        $('#incomingcallBox').show();
        $('#incomingCallFrom').html(call2.fromNumber);
    });
}

function getAccessTokenAndConnectToStringee(client) {
    var userId = $('#userIdToAuthen').val();

    let urlGetToken = getTokenUrl + "?userId=" + userId;
    $.getJSON(urlGetToken, function (res) {
        var access_token = res.access_token;
        client.connect(access_token);
    });
}

function testCall2() {
    var fromNumber = '0909982668';
    var toNumber = $('#toNumberBtn').val();

    call = new StringeeCall2(stringeeClient, fromNumber, toNumber, true);

    settingCallEvent(call);
    call.makeCall(function (res) {
        if (res.r == 0) {
            console.log('make call success');
            setCallStatus('Calling...');
        }
    });
}

function settingCallEvent(call1) {
    call1.on('addlocalstream', function (stream) {
        console.log('addlocalstream, khong xu ly event nay, xu ly o event: addlocaltrack');
    });

    call1.on('addlocaltrack', function (localtrack1) {
        console.log('addlocaltrack', localtrack1);

        var element = localtrack1.attach();
        document.getElementById("local_videos").querySelector(".video-content").appendChild(element);
        // Remove inline styles to let CSS handle sizing
        element.removeAttribute("style");
    });

    call1.on('addremotetrack', function (track) {
        var element = track.attach();
        document.getElementById("remote_videos").querySelector(".video-content").appendChild(element);
        // Remove inline styles to let CSS handle sizing
        element.removeAttribute("style");
    });


    call1.on('removeremotetrack', function (track) {
        track.detachAndRemove();
    });

    call1.on('removelocaltrack', function (track) {
        track.detachAndRemove();
    });

    call1.on('signalingstate', function (state) {
        console.log('signalingstate ', state);
        if (state.code === 6) {
            $('#incomingcallBox').hide();
        }

        if (state.code === 6) {
            setCallStatus('Ended');
            onstop();
        } else if (state.code === 3) {
            setCallStatus('Answered');
            test_stats();
        } else if (state.code === 5) {
            setCallStatus('User busy');
            onstop();
        }
    });
    call1.on('mediastate', function (state) {
        console.log('mediastate ', state);
    });
    call1.on('otherdevice', function (msg) {
        console.log('otherdevice ', msg);
        if (msg.type == 'CALL2_STATE') {
            if (msg.code == 200 || msg.code == 486) {
                $('#incomingcallBox').hide();
            }
        }
    });
    call1.on('info', function (info) {
        console.log('++++info ', info);
    });
}

function testAnswer() {
    call.answer(function (res) {
        console.log('answer res', res);
        if (res.r === 0) {
            test_stats();
            setCallStatus('Answered');
        }
    });
    $('#incomingcallBox').hide();
}

function testTransfer() {
    console.log("testTransfer");
    var to = $('#transferNumberInput').val();
    var toType = $('#toType').val();
    var transferType = $('#transferType').val();
    call.transferCall(to, toType, transferType, console.log);
}

function testHold() {
	console.log("testHold");
	var hold = holdState = !holdState;
	var hold = call.isOnHold;
	if (!hold) {
		call.sendHold(null, function (h) {
			var btn = document.getElementById("holdBtn");
			if (btn) {
				btn.innerHTML = h ? "Hold" : "Unhold";
			}
		}.bind(this, hold));
	} else {
		call.sendUnHold(function (h) {
			var btn = document.getElementById("holdBtn");
			if (btn) {
				btn.innerHTML = h ? "Hold" : "Unhold";
			}
		}.bind(this, hold));
	}
}

function testLeave() {
    console.log("testLeave");
    call.leaveRoom();
}

function testReject() {
    console.log('testReject');
    call.reject(function (res) {
        console.log('reject res', res);
    });
    $('#incomingcallBox').hide();
}

function testHangup() {
    call.hangup(function (res) {
        console.log('hangup res', res);
    });
    onstop();
}

function onstop() {
    console.log('=======onstop=====');

    if(timeout_stats){
        clearTimeout(timeout_stats);
    }

    if (!call) {
        return;
    }

    call.subscribedTracks.forEach(function (track) {
        track.detachAndRemove();
    });

}

function setCallStatus(status) {
    $('#txtStatus').html(status);
}

function testMute() {
    if (call.muted) {
        call.mute(false);
        console.log('unmuted');
    } else {
        call.mute(true);
        console.log('muted');
    }
}

function testDisableVideo() {
    if (call.localVideoEnabled) {
        call.enableLocalVideo(false);
        console.log('disable Local Video');
    } else {
        call.enableLocalVideo(true);
        console.log('enable Local Video');
    }
}

var timeout_stats;

function test_stats() {
    var time = 2000;//ms
    console.log('test_stats...');

    if (call && call.localTracks.length > 0) {
        call.localTracks[0].getBW().then((res) => {
            $('#audioSent').html(res.audioSent + ' kbits/s');
            $('#videoSent').html(res.videoSent + ' kbits/s');
        });
    }

    if (call && call.subscribedTracks.length > 0) {
        call.subscribedTracks[0].getBW().then((res) => {
            $('#audioReceived').html(res.audioReceived + ' kbits/s');
            $('#videoReceived').html(res.videoReceived + ' kbits/s');
        });
    }

    timeout_stats = setTimeout(function () {
        test_stats();
    }, time);
}