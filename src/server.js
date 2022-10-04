import http from "http";
import WebSocket from "ws";
import express from "express";
import { SocketAddress } from "net";

// express 어플리케이션 구성
const app = express();

app.set("view engine", "pug"); // view engine을 Pug로 설정
app.set("views", __dirname + "/views"); //view 디렉토리 설정

// public 디렉토리 설정, public 파일들은 FrontEnd에서 구동되는 코드.
// 유저가 볼수 있는 폴더를 따로 지정해줌.
app.use("/public", express.static(__dirname + "/public")); // public 폴더를 유저에게 공개.

app.get("/", (req, res) => res.render("home")); // 홈페이지로 이동시 사용될 템플릿을 렌더.
app.get("/*", (req, res) => res.redirect("/")); //catchall url (다른url 사용하지않을예정.)

const handleListen = () => console.log(`Listening on http://localhost:3000`);

// http,websocket 서버 두개 만듬.
const server = http.createServer(app); //http 서버
const wss = new WebSocket.Server({ server }); //websocket 서버

const allSockets = [];

// websocket 서버에 연결되었을 떄.
wss.on("connection", (socket) => {
  allSockets.push(socket);
  allSockets["nickname"] = "anon"; // 닉네임 정하지 않았을때.
  console.log("Connected to Browser ✅");
  socket.on("close", () => console.log("Connected to Browser ❌"));

  socket.on("message", (msg) => {
    const message = JSON.parse(msg.toString());
    switch (message.type) {
      case "new_message": //메세지 추가.
        allSockets.forEach((aSocket) =>
          aSocket.send(`${allSockets.nickname}:${message.payload}`)
        );
        break;
      case "nickname": //닉네임 변경
        allSockets["nickname"] = message.payload;
        break;
    }
  });
});

server.listen(80, handleListen);
