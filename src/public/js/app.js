const socket = new WebSocket(`ws://${window.location.host}`); // socket 서버로 접속.
const messageList = document.querySelector("ul");
const messageForm = document.querySelector("form#message");
const nickForm = document.querySelector("form#nickname");

//socket event
socket.addEventListener("open", () => {
  console.log("Connected to Server ✅");
});

socket.addEventListener("message", (message) => {
  const li = document.createElement("li");
  li.innerText = message.data;
  messageList.append(li);
});

socket.addEventListener("close", () => {
  console.log("Connected to Server ❌");
});

// JSON파일을 string으로 변형.
// (javascript object를 서버에 보내지 않고 string으로 변형하여 보냄.) : 서버에서 javascript를 안쓸 수도 있으니까.
function makeMessage(type, payload) {
  const msg = { type, payload };
  return JSON.stringify(msg);
}

//message
function handleSubmit(event) {
  event.preventDefault();
  const input = messageForm.querySelector("input");
  socket.send(makeMessage("new_message", input.value));

  const li = document.createElement("li");
  li.innerText = `You: ${input.value}`;
  messageList.append(li);

  input.value = "";
}
//nickname
function handleNickSubmit(event) {
  event.preventDefault();
  const input = nickForm.querySelector("input");
  socket.send(makeMessage("nickname", input.value));
  input.setAttribute("placeholder", `Your nick name is ${input.value}`);
  input.value = "";
}

messageForm.addEventListener("submit", handleSubmit);
nickForm.addEventListener("submit", handleNickSubmit);
