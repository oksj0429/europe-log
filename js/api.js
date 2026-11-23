// 커뮤니티 데이터 저장 위치
// 지금은 서버 없이 브라우저(localStorage)에 저장한다. (내 브라우저에서만 보임)
// 나중에 Render에 서버를 올리면 아래 따옴표 안에 서버 주소를 넣으면 모두가 같은 글을 보게 된다.
// 예: const API_BASE = "https://europe-log-server.onrender.com";
const API_BASE = window.API_BASE_OVERRIDE || "";

const TOPICS = ["지원·서류", "비자·보험", "숙소", "수업", "비용", "여행", "생활", "기타"];

// 무료 서버는 15분 동안 접속이 없으면 잠들어서, 첫 요청에 최대 1분 걸릴 수 있음
function serverNotice(show) {
  let n = document.getElementById("serverNotice");
  if (!n) {
    n = document.createElement("div");
    n.id = "serverNotice";
    n.innerText = "서버를 깨우는 중이에요. 처음 접속하면 최대 1분 정도 걸릴 수 있어요.";
    document.body.appendChild(n);
  }
  n.style.display = show ? "block" : "none";
}

// fetch + JSON 처리. 실패하면 서버가 보낸 오류 문구로 Error를 던짐
async function api(path, options) {
  if (!API_BASE) return localApi(path, options || {});   // 서버 없을 때
  const opts = Object.assign({ method: "GET" }, options || {});
  if (opts.body && typeof opts.body !== "string") {
    opts.body = JSON.stringify(opts.body);
    opts.headers = { "Content-Type": "application/json" };
  }
  const slow = setTimeout(function () { serverNotice(true); }, 3000);
  try {
    const res = await fetch(API_BASE + path, opts);
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || "요청에 실패했습니다.");
    return data;
  } catch (e) {
    if (e instanceof TypeError) throw new Error("서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.");
    throw e;
  } finally {
    clearTimeout(slow);
    serverNotice(false);
  }
}

// 작은 도우미들
function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.innerText = txt;   // 사용자 입력은 항상 innerText로 (태그 실행 방지)
  return e;
}
function fmtDate(ms) { return new Date(Number(ms)).toLocaleDateString("ko-KR"); }
function countryName(id) {
  const c = countries.find(function (x) { return x.id === id; });
  return c ? c.name : id;
}

// 좋아요 버튼: 같은 브라우저에서 한 번만 누를 수 있게 기록
function likeButton(type, item) {
  const key = "liked_" + type + "_" + item.id;
  const btn = el("button", "like-btn", "♥ " + item.likes);
  btn.type = "button";
  if (loadSafe(key, false)) btn.classList.add("on");
  btn.addEventListener("click", function () {
    if (loadSafe(key, false)) return;
    api("/api/" + type + "/" + item.id + "/like", { method: "POST" }).then(function (r) {
      btn.innerText = "♥ " + r.likes; btn.classList.add("on"); saveSafe(key, true);
    }).catch(function (e) { alert(e.message); });
  });
  return btn;
}

// 삭제 버튼: 글쓸 때 넣은 비밀번호를 확인
function deleteButton(type, item, onDone) {
  const btn = el("button", "link-btn", "삭제");
  btn.type = "button";
  btn.addEventListener("click", function () {
    const pw = prompt("삭제하려면 글쓸 때 입력한 비밀번호를 입력하세요.");
    if (!pw) return;
    api("/api/" + type + "/" + item.id, { method: "DELETE", body: { password: pw } })
      .then(onDone).catch(function (e) { alert(e.message); });
  });
  return btn;
}

/* ---------- 서버 없이 쓰는 저장소 (서버와 같은 주소·규칙으로 동작) ---------- */
const LOCAL_COUNTRIES = ["de", "is", "hr", "ch", "fr", "mc", "it", "at", "hu", "pt", "gb", "es"];
function lsLoad(name) { return loadSafe("community_" + name, []); }
function lsSave(name, list) { saveSafe("community_" + name, list); }
function nextId(list) { return list.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1; }
function pwHash(pw) {  // 브라우저 저장용 간단한 해시 (비밀번호 원문은 저장하지 않음)
  let h = 5381; const s = "europe-log:" + pw;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
}
function check(v, min, max) {
  const s = (typeof v === "string" ? v : "").trim();
  return s.length >= min && s.length <= max ? s : null;
}
function hasContact(s) {
  return /\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/.test(s) || /[\w.+-]+@[\w-]+\.[\w.]+/.test(s) ||
    /(카톡|카카오|kakao|오픈채팅|open\.kakao|인스타|insta|\bdm\b|텔레그램|telegram|라인\s?id)/i.test(s);
}
function strip(o) { const c = Object.assign({}, o); delete c.pw_hash; return c; }
function fail(msg) { return Promise.reject(new Error(msg)); }

function localApi(path, opts) {
  const method = opts.method || "GET";
  const b = opts.body || {};
  const url = new URL(path, "http://local");
  const p = url.pathname.split("/").filter(Boolean);   // ["api", ...]
  const q = Object.fromEntries(url.searchParams);
  let m;

  // 나라별 댓글
  if ((m = url.pathname.match(/^\/api\/countries\/(\w+)\/comments$/))) {
    const cid = m[1];
    if (!LOCAL_COUNTRIES.includes(cid)) return fail("없는 나라입니다.");
    const all = lsLoad("comments");
    if (method === "GET") return Promise.resolve(all.filter(function (c) { return c.country === cid; }).sort(function (x, y) { return y.id - x.id; }).map(strip));
    const nick = check(b.nick, 1, 12), text = check(b.text, 1, 300), pw = check(b.password, 4, 30);
    if (!nick || !text) return fail("닉네임과 내용을 확인해주세요.");
    if (!pw) return fail("삭제용 비밀번호를 4자 이상 입력해주세요.");
    const c = { id: nextId(all), country: cid, nick: nick, text: text, pw_hash: pwHash(pw), likes: 0, created_at: Date.now() };
    all.push(c); lsSave("comments", all); return Promise.resolve(strip(c));
  }

  // 글 목록 / 글 쓰기
  if (url.pathname === "/api/posts") {
    const posts = lsLoad("posts"), replies = lsLoad("replies");
    if (method === "GET") {
      const kind = q.kind === "companion" ? "companion" : "qna";
      let list = posts.filter(function (x) { return x.kind === kind; });
      if (q.country) list = list.filter(function (x) { return x.country === q.country; });
      if (q.topic) list = list.filter(function (x) { return x.topic === q.topic; });
      list.sort(q.sort === "likes" ? function (x, y) { return y.likes - x.likes || y.id - x.id; } : function (x, y) { return y.id - x.id; });
      return Promise.resolve(list.map(function (x) {
        return Object.assign(strip(x), { reply_count: replies.filter(function (r) { return r.post_id === x.id; }).length });
      }));
    }
    const kind = b.kind === "companion" ? "companion" : "qna";
    const nick = check(b.nick, 1, 12), title = check(b.title, 1, 60), body = check(b.body, 1, 2000), pw = check(b.password, 4, 30);
    if (!nick || !title || !body) return fail("닉네임, 제목, 내용을 확인해주세요.");
    if (!pw) return fail("삭제용 비밀번호를 4자 이상 입력해주세요.");
    if (!LOCAL_COUNTRIES.includes(b.country)) return fail("나라를 선택해주세요.");
    const post = { id: nextId(posts), kind: kind, nick: nick, title: title, body: body, country: b.country,
      topic: "", city: "", start_date: "", end_date: "", pw_hash: pwHash(pw), likes: 0, created_at: Date.now() };
    if (kind === "qna") {
      if (!TOPICS.includes(b.topic)) return fail("주제를 선택해주세요.");
      post.topic = b.topic;
    } else {
      post.city = check(b.city, 1, 30); post.start_date = check(b.start_date, 10, 10); post.end_date = check(b.end_date, 10, 10);
      if (!post.city || !post.start_date || !post.end_date) return fail("도시와 날짜를 입력해주세요.");
      if (post.start_date > post.end_date) return fail("끝나는 날짜가 시작 날짜보다 빠릅니다.");
      if (hasContact(title + " " + body + " " + post.city)) return fail("안전을 위해 연락처(전화번호, 이메일, 메신저 아이디)는 쓸 수 없어요. 댓글로 대화해주세요.");
    }
    posts.push(post); lsSave("posts", posts);
    return Promise.resolve(Object.assign(strip(post), { reply_count: 0 }));
  }

  // 글 보기 / 답변 쓰기
  if ((m = url.pathname.match(/^\/api\/posts\/(\d+)(\/replies)?$/))) {
    const id = Number(m[1]);
    const post = lsLoad("posts").find(function (x) { return x.id === id; });
    if (!post) return fail("글이 없습니다.");
    const replies = lsLoad("replies");
    if (!m[2]) {
      return Promise.resolve(Object.assign(strip(post), {
        replies: replies.filter(function (r) { return r.post_id === id; }).sort(function (x, y) { return x.id - y.id; }).map(strip)
      }));
    }
    const nick = check(b.nick, 1, 12), body = check(b.body, 1, 1000), pw = check(b.password, 4, 30);
    if (!nick || !body) return fail("닉네임과 내용을 확인해주세요.");
    if (!pw) return fail("삭제용 비밀번호를 4자 이상 입력해주세요.");
    if (post.kind === "companion" && hasContact(body)) return fail("안전을 위해 연락처는 쓸 수 없어요.");
    const r = { id: nextId(replies), post_id: id, nick: nick, body: body, pw_hash: pwHash(pw), likes: 0, created_at: Date.now() };
    replies.push(r); lsSave("replies", replies); return Promise.resolve(strip(r));
  }

  // 좋아요 / 삭제 (comment, post, reply)
  const TABLE = { comment: "comments", post: "posts", reply: "replies" }[p[1]];
  if (TABLE && p[2]) {
    const id = Number(p[2]);
    const list = lsLoad(TABLE);
    const item = list.find(function (x) { return x.id === id; });
    if (!item) return fail("없는 항목입니다.");
    if (p[3] === "like" && method === "POST") { item.likes += 1; lsSave(TABLE, list); return Promise.resolve({ likes: item.likes }); }
    if (method === "DELETE") {
      if (item.pw_hash !== pwHash(String(b.password || ""))) return fail("비밀번호가 맞지 않습니다.");
      lsSave(TABLE, list.filter(function (x) { return x.id !== id; }));
      if (TABLE === "posts") lsSave("replies", lsLoad("replies").filter(function (r) { return r.post_id !== id; }));
      return Promise.resolve({ ok: true });
    }
  }
  return fail("잘못된 요청입니다.");
}
