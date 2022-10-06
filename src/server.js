import http from "http";
import { Server } from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";

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
const httpServer = http.createServer(app); //http 서버
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
instrument(wsServer, {
  auth: false,
});

// publicRoom 만들기
function publicRooms() {
  const { sids, rooms } = wsServer.sockets.adapter;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

// room 안에 user 수 세기
function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

// 서버 연결되었을때.
wsServer.on("connection", (socket) => {
  /*
  socket["nickname"] = "Anon";
  wsServer.sockets.emit("room_change", publicRooms());
  socket.onAny((event) => {
    console.log(wsServer.sockets.adapter);
    console.log(`Socket Event:${event}`);
  });

  //방에 입장할때.
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
  });

  //연결이 끊어졌을때.
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });

  //연결이 끊어지고나서.
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });

  //새로운 메세지 입력했을때.
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `<b>${socket.nickname}</b>${msg}`);
    done();
  });

  //닉네임 입력했을때.
  socket.on("nickname", (nickname, roomName) => {
    socket["nickname"] = nickname;
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    wsServer.sockets.emit("room_change", publicRooms());
  });
  */

  //비디오
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
});

httpServer.listen(3000, handleListen);
