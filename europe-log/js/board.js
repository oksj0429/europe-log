const form = document.getElementById("boardForm");
const list = document.getElementById("posts");
const err = document.getElementById("boardErr");
let posts = loadSafe("posts", []);

function render() {
  list.innerHTML = "";
  if (posts.length === 0) { list.innerText = "아직 글이 없습니다."; return; }
  posts.slice().reverse().forEach(function (p) {
    const box = document.createElement("div");
    box.className = "post";
    const meta = document.createElement("div");
    meta.className = "meta";
    const who = document.createElement("span");
    who.innerText = p.nick + " · " + p.date;
    const del = document.createElement("button");
    del.className = "btn"; del.innerText = "삭제";
    del.addEventListener("click", function () {
      posts = posts.filter(function (x) { return x.id !== p.id; });
      saveSafe("posts", posts); render();
    });
    meta.appendChild(who); meta.appendChild(del);
    const body = document.createElement("p");
    body.innerText = p.content; // innerText: 입력값을 태그로 해석하지 않음
    box.appendChild(meta); box.appendChild(body);
    list.appendChild(box);
  });
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const nick = document.getElementById("nick").value.trim();
  const content = document.getElementById("content").value.trim();
  if (nick === "" || content === "") { err.innerText = "닉네임과 내용을 모두 입력해주세요."; return; }
  err.innerText = "";
  posts.push({ id: Date.now(), nick: nick, content: content, date: new Date().toLocaleDateString("ko-KR") });
  saveSafe("posts", posts);
  form.reset();
  render();
});
render();
