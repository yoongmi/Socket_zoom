import express from "express";

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

app.listen(3000, handleListen);
