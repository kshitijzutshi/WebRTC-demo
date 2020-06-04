let Peer = require("simple-peer");
let socket = io();
const video = document.querySelector("video");
const filter = document.querySelector("#filter");
const checkboxTheme = document.querySelector("#theme");
let client = {};
let currentFilter;
//get stream
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    socket.emit("NewClient");
    video.srcObject = stream;
    video.play();

    filter.addEventListener("change", (event) => {
      currentFilter = event.target.value;
      video.style.filter = currentFilter;
      SendFilter(currentFilter);
      event.preventDefault;
    });

    //used to initialize a peer
    function InitPeer(type) {
      let peer = new Peer({
        initiator: type == "init" ? true : false,
        stream: stream,
        trickle: false,
      });
      peer.on("stream", function (stream) {
        CreateVideo(stream);
      });
      //This isn't working in chrome; works perfectly in firefox.
      // peer.on('close', function () {
      //     document.getElementById("peerVideo").remove();
      //     peer.destroy()
      // })
      peer.on("data", function (data) {
        let decodedData = new TextDecoder("utf-8").decode(data);
        let peervideo = document.querySelector("#peerVideo");
        peervideo.style.filter = decodedData;
      });
      return peer;
    }

    //for peer of type init
    function MakePeer() {
      client.gotAnswer = false;
      let peer = InitPeer("init");
      peer.on("signal", function (data) {
        if (!client.gotAnswer) {
          socket.emit("Offer", data);
        }
      });
      client.peer = peer;
    }

    //for peer of type not init
    function FrontAnswer(offer) {
      let peer = InitPeer("notInit");
      peer.on("signal", (data) => {
        socket.emit("Answer", data);
      });
      peer.signal(offer);
      client.peer = peer;
    }

    function SignalAnswer(answer) {
      client.gotAnswer = true;
      let peer = client.peer;
      peer.signal(answer);
    }

    function CreateVideo(stream) {
      CreateDiv();

      let video = document.createElement("video");
      video.id = "peerVideo";
      video.srcObject = stream;
      video.setAttribute("class", "embed-responsive-item");
      document.querySelector("#peerDiv").appendChild(video);
      video.play();
      //wait for 1 sec
      setTimeout(() => SendFilter(currentFilter), 1000);

      video.addEventListener("click", () => {
        if (video.volume != 0) video.volume = 0;
        else video.volume = 1;
      });

      let video2 = document.createElement("video");
      video2.id = "peerVideo";
      video2.srcObject = stream;
      video2.setAttribute("class", "embed-responsive-item");
      document.querySelector("#peerDiv2").appendChild(video);
      video2.play();
      //wait for 1 sec
      setTimeout(() => SendFilter(currentFilter), 1000);

      video2.addEventListener("click", () => {
        if (video2.volume != 0) video2.volume = 0;
        else video2.volume = 1;
      });
    }

    function SessionActive() {
      document.write("Session Active. Please come back later");
    }

    function SendFilter(filter) {
      if (client.peer) {
        client.peer.send(filter);
      }
    }

    function RemovePeer() {
      document.getElementById("peerVideo").remove();
      document.getElementById("muteText").remove();
      if (client.peer) {
        client.peer.destroy();
      }
    }

    socket.on("BackOffer", FrontAnswer);
    socket.on("BackAnswer", SignalAnswer);
    socket.on("SessionActive", SessionActive);
    socket.on("CreatePeer", MakePeer);
    socket.on("Disconnect", RemovePeer);
  })
  .catch((err) => document.write(err));

checkboxTheme.addEventListener("click", () => {
  if (checkboxTheme.checked == true) {
    document.body.style.backgroundColor = "#212529";
    if (document.querySelector("#muteText")) {
      document.querySelector("#muteText").style.color = "#fff";
    }
  } else {
    document.body.style.backgroundColor = "#fff";
    if (document.querySelector("#muteText")) {
      document.querySelector("#muteText").style.color = "#212529";
    }
  }
});

function CreateDiv() {
  let div = document.createElement("div");
  div.setAttribute("class", "centered");
  div.id = "muteText";
  div.innerHTML = "Click to Mute/Unmute";
  document.querySelector("#peerDiv").appendChild(div);
  if (checkboxTheme.checked == true)
    document.querySelector("#muteText").style.color = "#fff";
}
