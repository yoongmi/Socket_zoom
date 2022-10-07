const socket = io();

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
