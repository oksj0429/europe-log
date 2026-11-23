// 나라별 댓글 (커뮤니티 서버에 저장되어 모든 방문자가 함께 봄)
function renderComments(c) {
  const box = document.getElementById("comments");
  box.innerHTML =
    '<form class="c-form" id="cForm">' +
    '<div class="row2"><input type="text" id="cNick" maxlength="12" placeholder="닉네임">' +
    '<input type="password" id="cPw" maxlength="30" placeholder="삭제용 비밀번호 (4자 이상)"></div>' +
    '<textarea id="cText" rows="2" maxlength="300" placeholder="' + c.name + '에 대한 경험이나 질문을 남겨주세요."></textarea>' +
    '<div class="err" id="cErr"></div>' +
    '<button class="btn primary" type="submit">댓글 등록</button></form>' +
    '<div id="cList"><p class="sub">댓글을 불러오는 중...</p></div>';
  const user = loadSafe("currentUser", null);
  if (user) document.getElementById("cNick").value = user.id;

  function load() {
    api("/api/countries/" + c.id + "/comments").then(draw).catch(function (e) {
      const el2 = document.getElementById("cList");
      if (el2) el2.innerHTML = '<p class="sub">' + e.message + "</p>";
    });
  }

  function draw(list) {
    const wrap = document.getElementById("cList");
    if (!wrap) return;                         // 다른 나라로 이동한 경우
    wrap.innerHTML = "";
    if (list.length === 0) { wrap.appendChild(el("p", "sub", "첫 댓글을 남겨보세요.")); return; }
    list.forEach(function (cm) {
      const item = el("div", "comment");
      const meta = el("div", "meta");
      meta.appendChild(el("span", "", cm.nick + " · " + fmtDate(cm.created_at)));
      const right = el("span", "actions");
      right.appendChild(likeButton("comment", cm));
      right.appendChild(deleteButton("comment", cm, load));
      meta.appendChild(right);
      item.appendChild(meta);
      item.appendChild(el("p", "", cm.text));
      wrap.appendChild(item);
    });
  }

  document.getElementById("cForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const err = document.getElementById("cErr");
    const body = {
      nick: document.getElementById("cNick").value,
      password: document.getElementById("cPw").value,
      text: document.getElementById("cText").value
    };
    err.innerText = "";
    api("/api/countries/" + c.id + "/comments", { method: "POST", body: body }).then(function () {
      document.getElementById("cText").value = "";
      load();
    }).catch(function (e2) { err.innerText = e2.message; });
  });

  load();
}
