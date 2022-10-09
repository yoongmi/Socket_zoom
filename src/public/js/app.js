const socket = io();

//video
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream;
let muted = false;
let cameraOff = false;
let myDataChannel;

// 비디오, 오디오 표시
async function getMedia(deviceId) {
  const initialConstraints = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstraints
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

// 음소거
function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "UnMute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}
// 카메라끄기
function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera ON";
    cameraOff = true;
  }
}

// 카메라 종류 가져오기.
async function getCameras() {
  try {
    const deviced = await navigator.mediaDevices.enumerateDevices();
    const cameras = deviced.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.lable == camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

// 카메라 변경할때.
async function handleCameraChange() {
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// 방 만들기.
const welcome = document.getElementById("welcome");
const call = document.getElementById("call");
welcomeForm = welcome.querySelector("form");
const roomTitle = call.querySelector("h3");
const myName = document.getElementById("myName");
const peerName = document.getElementById("peerName");

let roomName;

call.hidden = true;

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const inputRoom = welcomeForm.querySelector("input.roomName");
  const inputNick = welcomeForm.querySelector("input.nickName");
  await initCall();
  socket.emit("join_room", inputRoom.value, inputNick.value);
  roomName = inputRoom.value;
  roomTitle.innerText = `Room ${roomName} (1)`;
  myName.innerText = inputNick.value;
  socket.emit("nickname", inputRoom.value, inputNick.value);
  inputRoom.value = "";

  chatting(`${inputNick.value} Join!`, "notice");
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// 메세지 추가
const ChattingRoom = document.getElementById("myChat");
const ChatForm = document.getElementById("msg");
const ChatInput = ChatForm.querySelector("input");

function chatting(message, purpose) {
  //purpose : notice, you, other
  const li = document.createElement("li");
  li.className = purpose;
  li.innerHTML = message;
  ChattingRoom.appendChild(li);
}

// 메세지 입력
function handleMessageSubmit(e) {
  e.preventDefault();
  const value = ChatInput.value;
  myDataChannel.send(value);
  chatting(value, "you");
  ChatInput.value = "";
}
ChatForm.addEventListener("submit", handleMessageSubmit);

// room 리스트 보여주기
const roomList = document.getElementById("roomList");
socket.on("room_change", (rooms) => {
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});

// socket code
socket.on("welcome", async (nickname, roomname, count) => {
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", (event) =>
    chatting(`<b>${nickname}</b>${event.data}`, "other")
  );

  roomTitle.innerText = `Room ${roomname} (${count})`;
  peerName.innerText = nickname;
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName, count);
});

socket.on("nickname", (name) => {
  chatting(`${name} Join!`, "notice");
});

socket.on("offer", async (offer, nickname, count) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (event) =>
      chatting(`<b>${nickname}</b>${event.data}`, "other")
    );
  });
  peerName.innerText = nickname;
  roomTitle.innerText = `Room ${roomName} (${count})`;
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
});

socket.on("bye", (leftUser, newCount) => {
  roomTitle.innerText = `Room ${roomName} (${newCount})`;
  chatting(`${leftUser} left!`, "notice");
  peerName.innerText = "";
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = null;
});

// RTC code
let myPeerConnection;

function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("send candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.stream;
}
