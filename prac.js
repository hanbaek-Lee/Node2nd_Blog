function nick() {
  if (nick == /^[a-zA-Z][0-9a-zA-Z]$/) {
    return nick();
  } else {
    console.log("아이디는 영문, 숫자만 입력가능합니다.");
  }
}
console.log(nick("dfdfdfdfd"));
