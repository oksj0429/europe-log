// 공통: 상단 메뉴, 다크모드, 로그인 표시
const PAGES = [
  ["index.html", "홈"], ["timeline.html", "타임라인"], ["guide.html", "가이드"],
  ["about.html", "소개·후기"], ["board.html", "자유게시판"], ["signup.html", "회원가입"]
];
function loadSafe(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
}
function saveSafe(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}
function applyTheme(t) { document.documentElement.setAttribute("data-theme", t); }
applyTheme(loadSafe("theme", "light"));

window.addEventListener("DOMContentLoaded", function () {
  const cur = location.pathname.split("/").pop() || "index.html";
  const header = document.createElement("header");
  header.className = "nav";
  let html = '<a class="logo" href="index.html">유럽, 지나온 길</a>';
  PAGES.forEach(function (p) {
    html += '<a class="link' + (p[0] === cur ? " active" : "") + '" href="' + p[0] + '">' + p[1] + "</a>";
  });
  html += '<span id="userBadge"></span><button id="themeBtn" type="button">다크모드</button>';
  header.innerHTML = html;
  document.body.prepend(header);

  const user = loadSafe("currentUser", null);
  if (user) document.getElementById("userBadge").innerText = user.id + " 님";

  document.getElementById("themeBtn").addEventListener("click", function () {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next); saveSafe("theme", next);
    if (window.onThemeChange) window.onThemeChange(next);
  });

  const footer = document.createElement("footer");
  footer.innerText = "© 2026 이서준 · 웹프로그래밍 프로젝트";
  document.body.appendChild(footer);
});
