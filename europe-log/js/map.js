const panel = document.getElementById("panel");
const map = L.map("map", { zoomControl: true }).setView([50, 12], 4);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors", maxZoom: 10
}).addTo(map);

// 국기: Windows는 국기 이모지가 글자로 보여서 이미지로 표시
function flag(c) {
  return '<img class="flag" src="https://flagcdn.com/24x18/' + c.id + '.png" alt="">';
}

const WEATHER = { 0: "맑음", 1: "대체로 맑음", 2: "구름 조금", 3: "흐림", 45: "안개", 48: "안개", 51: "이슬비", 53: "이슬비",
  55: "이슬비", 61: "비", 63: "비", 65: "강한 비", 71: "눈", 73: "눈", 75: "많은 눈", 80: "소나기", 95: "뇌우" };


// 구글맵 임베드용 검색어 (API 키 없이 iframe으로 넣는 방식)
const MAP_QUERY = {
  de: "Bavaria, Germany", is: "Iceland", hr: "Dubrovnik, Croatia", ch: "Zermatt, Switzerland",
  fr: "Nice, France", mc: "Monaco", it: "Italy", at: "Vienna, Austria",
  hu: "Budapest, Hungary", pt: "Porto, Portugal", gb: "London, UK", es: "Spain"
};

// 핀 생성
countries.forEach(function (c) {
  const marker = L.marker([c.lat, c.lng]).addTo(map);
  marker.bindTooltip(c.name);
  marker.on("click", function () { showCountry(c); });
  c.marker = marker;
});

function showHome() {
  let chips = "";
  countries.forEach(function (c) {
    chips += '<button class="chip" data-id="' + c.id + '">' + flag(c) + " " + c.name + "</button>";
  });
  panel.innerHTML =
    '<div class="hero"><h2>How was the Europe so far?</h2>' +
    '<p class="sub">교환학생 기간 동안 다녀온 ' + countries.length + "개국의 기록입니다. 지도의 핀이나 아래 나라를 눌러보세요.</p></div>" +
    '<div class="chips">' + chips + "</div>" +
    '<button class="btn" id="routeBtn" type="button">여정 경로 보기</button>';
  panel.querySelectorAll(".chip").forEach(function (b) {
    b.addEventListener("click", function () {
      const c = countries.find(function (x) { return x.id === b.dataset.id; });
      showCountry(c);
    });
  });
  document.getElementById("routeBtn").addEventListener("click", drawRoute);
}

function showCountry(c) {
  map.flyTo([c.lat, c.lng], 5, { duration: 0.8 });
  saveSafe("lastCountry", c.id);
  panel.innerHTML =
    '<button class="btn" id="backBtn" type="button">← 목록</button>' +
    '<div class="info"><h2 style="margin-top:16px">' + flag(c) + " " + c.name + "</h2>" +
    photoHtml(c) +
    (c.cities ? '<p class="sub">방문: ' + c.cities + "</p>" : "") + "<p>" + c.summary + "</p>" +
    '<div class="label">영상</div><div class="video" id="video"></div>' +
    '<div class="label">구글 지도</div><div class="gmap" id="gmap"></div>' +
    '<div class="label">현재 날씨</div><div class="weather" id="weather">불러오는 중...</div>' +
    '<div class="label">댓글</div><div id="comments"></div></div>';
  document.getElementById("backBtn").addEventListener("click", showHome);
  renderVideo(c);
  renderGoogleMap(c);
  loadWeather(c);
  renderComments(c);
}

// 대표 사진 (Unsplash 무료 사진, 사진작가와 출처 표시)
function photoHtml(c) {
  if (!c.photo) return "";
  const p = c.photo;
  return '<figure class="hero"><img src="' + p.url + '" alt="' + p.caption + '" loading="lazy">' +
    '<figcaption>' + p.caption + ' · Photo by <a href="' + p.authorLink + '" target="_blank" rel="noopener">' + p.author +
    '</a> on <a href="' + p.source + '" target="_blank" rel="noopener">Unsplash</a></figcaption></figure>';
}

// 영상: 인스타그램 게시물/릴스 주소 또는 YouTube ID. 여러 개면 배열로 적기
function videoFrame(v) {
  const insta = v.match(/instagram\.com\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  if (insta) {
    const type = insta[1] === "reels" ? "reel" : insta[1];
    return '<iframe class="insta" src="https://www.instagram.com/' + type + "/" + insta[2] + '/embed" allowfullscreen loading="lazy"></iframe>';
  }
  return '<iframe src="https://www.youtube.com/embed/' + v + '" allowfullscreen loading="lazy"></iframe>';
}
function renderVideo(c) {
  const v = document.getElementById("video");
  const list = Array.isArray(c.video) ? c.video : (c.video ? [c.video] : []);
  if (list.length === 0) { v.innerText = "영상을 준비 중입니다."; return; }
  const isInsta = list.some(function (x) { return x.indexOf("instagram.com") !== -1; });
  if (isInsta) v.classList.add("has-insta");
  v.innerHTML = list.map(videoFrame).join("");
}

// 구글맵 임베드: 키 없이 iframe의 src에 검색어를 넣어 지도 표시
function renderGoogleMap(c) {
  const box = document.getElementById("gmap");
  const q = encodeURIComponent(MAP_QUERY[c.id] || c.name);
  box.innerHTML = '<iframe src="https://maps.google.com/maps?q=' + q + '&z=8&output=embed" loading="lazy" title="' + c.name + ' 구글 지도"></iframe>';
}

// 외부 API(Open-Meteo): fetch + JSON
function loadWeather(c) {
  const w = document.getElementById("weather");
  const url = "https://api.open-meteo.com/v1/forecast?latitude=" + c.lat + "&longitude=" + c.lng + "&current_weather=true";
  fetch(url)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      const cw = data.current_weather;
      w.innerText = cw.temperature + "°C · " + (WEATHER[cw.weathercode] || "정보 없음") + " · 풍속 " + cw.windspeed + "km/h";
    })
    .catch(function () { w.innerText = "날씨 정보를 불러오지 못했습니다."; });
}

// 여정 경로 애니메이션: 독일에서 각 나라로 선을 차례로 그림
let routeLines = [];
let routeTimer = null;
function drawRoute() {
  routeLines.forEach(function (l) { map.removeLayer(l); });
  routeLines = [];
  clearInterval(routeTimer);
  const origin = countries[0];
  let i = 1;
  map.flyTo([50, 12], 4);
  routeTimer = setInterval(function () {
    if (i >= countries.length) { clearInterval(routeTimer); return; }
    const c = countries[i];
    const line = L.polyline([[origin.lat, origin.lng], [c.lat, c.lng]], { color: "#3d5a80", weight: 2, dashArray: "6 6" }).addTo(map);
    routeLines.push(line);
    i++;
  }, 500);
}

showHome();
const last = loadSafe("lastCountry", null);
if (last) {
  const lc = countries.find(function (x) { return x.id === last; });
  if (lc) showCountry(lc);
}
