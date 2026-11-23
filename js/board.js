// 커뮤니티: Q&A 게시판 + 동행 구하기 (커뮤니티 서버에 저장)
let kind = "qna";   // "qna" 또는 "companion"

const listView = document.getElementById("listView");
const detailView = document.getElementById("detailView");
const writeForm = document.getElementById("writeForm");
const fCountry = document.getElementById("fCountry");
const fTopic = document.getElementById("fTopic");
const fSort = document.getElementById("fSort");

// 나라, 주제 선택 상자 채우기
countries.forEach(function (c) {
  fCountry.appendChild(new Option(c.name, c.id));
  document.getElementById("wCountry").appendChild(new Option(c.name, c.id));
});
TOPICS.forEach(function (t) {
  fTopic.appendChild(new Option(t, t));
  document.getElementById("wTopic").appendChild(new Option(t, t));
});
const me = loadSafe("currentUser", null);
if (me) document.getElementById("wNick").value = me.id;

// 탭 전환
document.querySelectorAll(".tab").forEach(function (tab) {
  tab.addEventListener("click", function () {
    document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
    tab.classList.add("active");
    kind = tab.dataset.kind;
    applyKind();
    showList();
  });
});

function applyKind() {
  const isQna = kind === "qna";
  fTopic.hidden = !isQna;
  document.querySelectorAll(".qna-only").forEach(function (e) { e.hidden = !isQna; });
  document.querySelectorAll(".comp-only").forEach(function (e) { e.hidden = isQna; });
  document.getElementById("wTitle").placeholder = isQna ? "예: 독일 학생비자 어떻게 받으셨나요?" : "예: 12월 뮌헨 크리스마스 마켓 같이 가실 분";
}

[fCountry, fTopic, fSort].forEach(function (s) { s.addEventListener("change", loadList); });

document.getElementById("writeBtn").addEventListener("click", function () {
  writeForm.hidden = !writeForm.hidden;
});

// 목록
function showList() {
  detailView.hidden = true;
  listView.hidden = false;
  loadList();
}

function loadList() {
  const list = document.getElementById("postList");
  list.innerHTML = '<p class="sub">불러오는 중...</p>';
  let q = "?kind=" + kind + "&sort=" + fSort.value;
  if (fCountry.value) q += "&country=" + fCountry.value;
  if (kind === "qna" && fTopic.value) q += "&topic=" + encodeURIComponent(fTopic.value);
  api("/api/posts" + q).then(function (posts) {
    list.innerHTML = "";
    if (posts.length === 0) { list.appendChild(el("p", "sub", "아직 글이 없어요. 첫 글을 남겨보세요.")); return; }
    posts.forEach(function (p) { list.appendChild(postCard(p)); });
  }).catch(function (e) { list.innerHTML = ""; list.appendChild(el("p", "sub", e.message)); });
}

function tags(p) {
  const t = el("div", "tags");
  t.appendChild(el("span", "tag", countryName(p.country)));
  if (p.kind === "qna") t.appendChild(el("span", "tag", p.topic));
  else t.appendChild(el("span", "tag", p.city + " · " + p.start_date + " ~ " + p.end_date));
  return t;
}

function postCard(p) {
  const card = el("article", "post-card");
  card.appendChild(tags(p));
  card.appendChild(el("h3", "", p.title));
  const meta = el("div", "meta");
  meta.appendChild(el("span", "", p.nick + " · " + fmtDate(p.created_at)));
  meta.appendChild(el("span", "", "♥ " + p.likes + "  ·  " + (p.kind === "qna" ? "답변 " : "댓글 ") + p.reply_count));
  card.appendChild(meta);
  card.addEventListener("click", function () { showDetail(p.id); });
  return card;
}

// 글 보기
function showDetail(id) {
  listView.hidden = true;
  detailView.hidden = false;
  detailView.innerHTML = '<p class="sub">불러오는 중...</p>';
  api("/api/posts/" + id).then(function (p) {
    detailView.innerHTML = "";
    const back = el("button", "btn", "← 목록");
    back.type = "button";
    back.addEventListener("click", showList);
    detailView.appendChild(back);

    const art = el("article", "post-detail");
    art.appendChild(tags(p));
    art.appendChild(el("h2", "", p.title));
    const meta = el("div", "meta");
    meta.appendChild(el("span", "", p.nick + " · " + fmtDate(p.created_at)));
    const act = el("span", "actions");
    act.appendChild(likeButton("post", p));
    act.appendChild(deleteButton("post", p, showList));
    meta.appendChild(act);
    art.appendChild(meta);
    art.appendChild(el("p", "post-body", p.body));
    detailView.appendChild(art);

    const word = p.kind === "qna" ? "답변" : "댓글";
    detailView.appendChild(el("h3", "", word + " " + p.replies.length));
    p.replies.forEach(function (r) {
      const item = el("div", "comment");
      const m = el("div", "meta");
      m.appendChild(el("span", "", r.nick + " · " + fmtDate(r.created_at)));
      const a = el("span", "actions");
      a.appendChild(likeButton("reply", r));
      a.appendChild(deleteButton("reply", r, function () { showDetail(p.id); }));
      m.appendChild(a);
      item.appendChild(m);
      item.appendChild(el("p", "", r.body));
      detailView.appendChild(item);
    });

    // 답변 쓰기
    const f = el("form", "c-form");
    f.innerHTML = '<div class="row2"><input type="text" class="rNick" maxlength="12" placeholder="닉네임">' +
      '<input type="password" class="rPw" maxlength="30" placeholder="삭제용 비밀번호 (4자 이상)"></div>' +
      '<textarea class="rBody" rows="3" maxlength="1000"></textarea><div class="err"></div>' +
      '<button class="btn primary" type="submit">' + word + " 등록</button>";
    f.querySelector(".rBody").placeholder = p.kind === "qna" ? "알고 있는 내용을 알려주세요." : "같이 가고 싶다면 댓글을 남겨주세요. (연락처는 쓸 수 없어요)";
    if (me) f.querySelector(".rNick").value = me.id;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      api("/api/posts/" + p.id + "/replies", { method: "POST", body: {
        nick: f.querySelector(".rNick").value, password: f.querySelector(".rPw").value, body: f.querySelector(".rBody").value
      } }).then(function () { showDetail(p.id); })
        .catch(function (e2) { f.querySelector(".err").innerText = e2.message; });
    });
    detailView.appendChild(f);
  }).catch(function (e) { detailView.innerHTML = ""; detailView.appendChild(el("p", "sub", e.message)); });
}

// 글 등록
writeForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const v = function (id) { return document.getElementById(id).value; };
  const body = { kind: kind, nick: v("wNick"), password: v("wPw"), country: v("wCountry"), title: v("wTitle"), body: v("wBody") };
  if (kind === "qna") body.topic = v("wTopic");
  else { body.city = v("wCity"); body.start_date = v("wStart"); body.end_date = v("wEnd"); }
  const err = document.getElementById("wErr");
  err.innerText = "";
  api("/api/posts", { method: "POST", body: body }).then(function (p) {
    ["wTitle", "wBody", "wCity"].forEach(function (id) { document.getElementById(id).value = ""; });
    writeForm.hidden = true;
    showDetail(p.id);
  }).catch(function (e2) { err.innerText = e2.message; });
});

if (API_BASE) document.getElementById("localNotice").hidden = true;
applyKind();
loadList();
