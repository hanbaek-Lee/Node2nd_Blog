const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middlewares/auth-middleware");

mongoose.connect("mongodb://localhost/shopping-demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();

// 회원가입 API [POST]
/*
  회원가입 조건
  OK 닉네임 최소 3자이상 알파벳 대소문자, 숫자로 구성 [자바스크립트 정규표현식] 사용하기
  OK 비밀번호 최소 4자이상, 닉메임과 같은값이 포함된 경우 실패 
  OK 비밀번호와 컨펌비밀번호 일치하면 회원가입 성공
  4) 닉네임, 비밀번호, 비밀번호 확인을 request에서 전달받기
  OK 데이터 베이스에서 존재하는 닉네임 입력한채 회원가입 버튼 누르면 "중복된 닉네임 입니다." 에러메세지 response에 포함시키기
*/
router.post("/users", async (req, res) => {
  const { nickname, password, confirmPassword } = req.body;

  const checkNickname = /^[0-9a-zA-Z]{3,}$/.test(nickname);
  if (!checkNickname) {
    res.status(400).send({
      errorMessage: "아이디는 영문, 숫자만 입력가능합니다.",
    });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).send({
      errorMessage: "패스워드가 일치하지 않습니다.",
    });
    return;
  }
  if (!String(password).includes(`${nickname}`)) {
    res.status(400).send({
      errorMessage: "패스워드에 닉네임이 포함되지 않아야 합니다.",
    });
    return;
  }

  if (String(password).length < 4) {
    res.status(400).send({
      errorMessage: "비밀번호는 최소 4자 이상으로 해주세요.",
    });
    return;
  }

  const existUsers = await User.find({
    nickname,
  });
  if (existUsers) {
    res.status(400).send({
      errorMessage: "중복된 닉네임 입니다.",
    });
    return;
  }

  const user = new User({ nickname, password });
  await user.save();
  res.status(201).send({
    Message: "회원가입이 완료 되었습니다.",
  });
});

// 로그인 API [POST] get 메서드보다 장점이 있다.
router.post("/auth", async (req, res) => {
  const { nickname, password } = req.body;
  const user = await user.findOne({ nickname, password }).exec();
  if (!user) {
    res.status(400).send({
      errorMessage: "닉네임 또는 패스워드가 잘못됐습니다.",
    });
    return;
  }

  const token = jwt.sign({ userId: user.userId }, "my-secrey-kkkk");
  res.send({
    token,
  });
});

router.get("/users/me", authMiddleware, async (req, res) => {
  res.status(400).send({});
});
app.use("/api", express.urlencoded({ extended: false }), router);

app.listen(8080, () => {
  console.log("서버가 요청을 받을 준비가 됐어요");
});

app.get("/api", async (req, res) => {
  await res.send("시작페이지");
});

// 전체 게시글 목록 조회 API[GET]
router.get("/post", async (req, res) => {
  try {
    console.log("게시글 전체 목록 조회 api");
    const post_list = await Posts.find({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).send({
      result: {
        post_list,
      },
    });
  } catch (error) {
    return res.status(400).json({ error });
  }
});

// 게시글 작성 API[POST]
router.post(
  "/post",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("게시판 작성 api");

      const { userId } = res.locals.user;
      console.log(userId);
      const { title, content, layout } = req.body;
      const { image } = req.file;
      console.log("image", req.file.filename);
      // db 저장
      await Posts.create({
        title,
        content,
        userId,
        layout,
        image: req.file.filename,
      });

      res.status(201).send({
        result: {
          success: true,
          msg: "게시글 작성이 완료되었습나다.",
        },
      });
    } catch (error) {
      return res.status(400).json({
        result: {
          success: false,
          error,
        },
      });
    }
  }
);
