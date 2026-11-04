const sform = document.getElementById("signupForm");
const serr = document.getElementById("signupErr");
const box = document.getElementById("interests");
countries.forEach(function (c) {
  const label = document.createElement("label");
  label.innerHTML = '<input type="checkbox" name="interest" value="' + c.name + '"> ' + c.flag + " " + c.name;
  box.appendChild(label);
});

sform.addEventListener("submit", function (e) {
  e.preventDefault();
  const id = sform.uid.value.trim();
  const pw = sform.pw.value;
  const pw2 = sform.pw2.value;
  const email = sform.email.value.trim();
  const interests = Array.from(document.querySelectorAll("input[name='interest']:checked")).map(function (c) { return c.value; });
  serr.className = "err";

  if (!/^[A-Za-z0-9]{4,12}$/.test(id)) { serr.innerText = "아이디는 영문/숫자 4~12자로 입력해주세요."; return; }
  if (pw.length < 6) { serr.innerText = "비밀번호는 6자 이상이어야 합니다."; return; }
  if (pw !== pw2) { serr.innerText = "비밀번호가 일치하지 않습니다."; return; }
  if (!/^\S+@\S+\.\S+$/.test(email)) { serr.innerText = "이메일 형식이 올바르지 않습니다."; return; }

  const users = loadSafe("users", []);
  if (users.some(function (u) { return u.id === id; })) { serr.innerText = "이미 사용 중인 아이디입니다."; return; }
  users.push({ id: id, email: email, interests: interests }); // 비밀번호는 저장하지 않음
  saveSafe("users", users);
  saveSafe("currentUser", { id: id });
  serr.className = "err ok";
  serr.innerText = id + " 님, 가입이 완료되었습니다!";
  document.getElementById("userBadge").innerText = id + " 님";
  sform.reset();
});
