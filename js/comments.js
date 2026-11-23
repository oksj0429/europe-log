// 나라별 댓글
// 지금은 브라우저(localStorage)에 저장하고, 나중에 Node.js 서버로 바꿀 때
// 아래 두 함수(getComments, addComment, deleteComment)만 fetch로 바꾸면 되도록 Promise로 만듦
const CommentStore = {
  getComments: function (countryId) {
    return Promise.resolve(loadSafe("comments_" + countryId, []));
  },
  addComment: function (countryId, comment) {
    const list = loadSafe("comments_" + countryId, []);
    list.push(comment);
    saveSafe("comments_" + countryId, list);
    return Promise.resolve(list);
  },
  deleteComment: function (countryId, commentId) {
    const list = loadSafe("comments_" + countryId, []).filter(function (x) { return x.id !== commentId; });
    saveSafe("comments_" + countryId, list);
    return Promise.resolve(list);
  }
};

function renderComments(c) {
  const box = document.getElementById("comments");
  const user = loadSafe("currentUser", null);
  box.innerHTML =
    '<form class="c-form" id="cForm">' +
    '<input type="text" id="cNick" maxlength="12" placeholder="닉네임">' +
    '<textarea id="cText" rows="2" maxlength="200" placeholder="' + c.name + '에 대한 경험이나 질문을 남겨주세요."></textarea>' +
    '<div class="err" id="cErr"></div>' +
    '<button class="btn primary" type="submit">댓글 등록</button></form>' +
    '<div id="cList"></div>';
  if (user) document.getElementById("cNick").value = user.id;

  function draw(list) {
    const el = document.getElementById("cList");
    if (!el) return;            // 다른 나라로 이동한 경우
    el.innerHTML = "";
    if (list.length === 0) { el.innerHTML = '<p class="sub">첫 댓글을 남겨보세요.</p>'; return; }
    list.slice().reverse().forEach(function (cm) {
      const item = document.createElement("div");
      item.className = "comment";
      const meta = document.createElement("div");
      meta.className = "meta";
      const who = document.createElement("span");
      who.innerText = cm.nick + " · " + cm.date;
      const del = document.createElement("button");
      del.className = "link-btn"; del.type = "button"; del.innerText = "삭제";
      del.addEventListener("click", function () { CommentStore.deleteComment(c.id, cm.id).then(draw); });
      meta.appendChild(who); meta.appendChild(del);
      const body = document.createElement("p");
      body.innerText = cm.text;   // 입력값을 태그로 해석하지 않음
      item.appendChild(meta); item.appendChild(body);
      el.appendChild(item);
    });
  }

  document.getElementById("cForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const nick = document.getElementById("cNick").value.trim();
    const text = document.getElementById("cText").value.trim();
    const err = document.getElementById("cErr");
    if (nick === "" || text === "") { err.innerText = "닉네임과 내용을 입력해주세요."; return; }
    err.innerText = "";
    const comment = { id: Date.now(), nick: nick, text: text, date: new Date().toLocaleDateString("ko-KR") };
    CommentStore.addComment(c.id, comment).then(draw);
    document.getElementById("cText").value = "";
  });

  CommentStore.getComments(c.id).then(draw);
}
