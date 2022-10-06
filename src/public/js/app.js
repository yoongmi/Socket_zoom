const socket = io();
/*
const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

const room = document.getElementById("room");
const msgForm = room.querySelector("#msg");
const nameForm = room.querySelector("#name");

const chat = document.getElementById("chat");

room.hidden = true;
let roomName;

form.addEventListener("submit", handleRoomSubmit);

// 1.
// room 입력
function handleRoomSubmit(e) {
  e.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
}

// 2.
// 닉네임 입력
function handleNicknameSubmit(e) {
  e.preventDefault();
  nameForm.hidden = true;
  chat.hidden = false;

  const input = room.querySelector("#name input");
  const value = input.value;
  const h3 = room.querySelector("h3");
  addMessage(`${value}(You) joined!`, "notice");
  socket.emit("nickname", input.value, roomName);

  input.value = "";
}

// 3.
// room 보여주기
function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  chat.hidden = true;

  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;
  msgForm.addEventListener("submit", handleMessageSubmit);
  nameForm.addEventListener("submit", handleNicknameSubmit);
}

// 메세지 입력
function handleMessageSubmit(e) {
  e.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;
  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`${value}`, "you");
  });
  input.value = "";
}

// 메세지 추가
function addMessage(message, purpose) {
  //purpose : notice, you, other
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.className = purpose;
  li.innerHTML = message;
  ul.append(li);
}

//-------------back에서 받아온 것들.
// 방에 입장할때
socket.on("welcome", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}(${newCount})`;
  addMessage(`${user} joined!`, "notice");
});

// 방에서 나갈때
socket.on("bye", (leftUser, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}(${newCount})`;
  if (leftUser === "Anon") return;
  addMessage(`${leftUser} left!`, "notice");
});

// 메세지 보여주기
socket.on("new_message", (msg) => addMessage(msg, "other"));

// room 리스트 보여주기
socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
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
*/

//video
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream;
let muted = false;
let cameraOff = false;

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
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// socket code
socket.on("welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer");
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  console.log("receive ice answer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("send ice answer");
});

socket.on("answer", (answer) => {
  console.log("receive ice answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  console.log("receive candidate");
  myPeerConnection.addIceCandidate(ice);
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
