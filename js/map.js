const panel = document.getElementById("panel");
const map = L.map("map", { zoomControl: true }).setView([50, 12], 4);

const TILES = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
};
let tileLayer;
function setTiles(theme) {
  if (tileLayer) map.removeLayer(tileLayer);
  tileLayer = L.tileLayer(TILES[theme] || TILES.light, {
    attribution: "© OpenStreetMap © CARTO", maxZoom: 10
  }).addTo(map);
}
setTiles(loadSafe("theme", "light"));
window.onThemeChange = setTiles;

const WEATHER = { 0: "맑음", 1: "대체로 맑음", 2: "구름 조금", 3: "흐림", 45: "안개", 48: "안개", 51: "이슬비", 53: "이슬비",
  55: "이슬비", 61: "비", 63: "비", 65: "강한 비", 71: "눈", 73: "눈", 75: "많은 눈", 80: "소나기", 95: "뇌우" };

let gIndex = 0;

// 핀 생성
countries.forEach(function (c) {
  const marker = L.marker([c.lat, c.lng]).addTo(map);
  marker.bindTooltip(c.flag + " " + c.name);
  marker.on("click", function () { showCountry(c); });
  c.marker = marker;
});

function showHome() {
  let chips = "";
  countries.forEach(function (c) {
    chips += '<button class="chip" data-id="' + c.id + '">' + c.flag + " " + c.name + "</button>";
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
  gIndex = 0;
  panel.innerHTML =
    '<button class="btn" id="backBtn" type="button">← 목록</button>' +
    '<div class="info"><h2 style="margin-top:16px">' + c.flag + " " + c.name + "</h2>" +
    '<p class="sub">' + c.period + "</p><p>" + c.summary + "</p>" +
    '<div class="label">사진</div><div class="gallery" id="gallery"></div>' +
    '<div class="label">영상</div><div class="video" id="video"></div>' +
    '<div class="label">현재 날씨</div><div class="weather" id="weather">불러오는 중...</div></div>';
  document.getElementById("backBtn").addEventListener("click", showHome);
  renderGallery(c);
  renderVideo(c);
  loadWeather(c);
}

function renderGallery(c) {
  const g = document.getElementById("gallery");
  if (c.photos.length === 0) { g.innerText = "사진을 준비 중입니다."; return; }
  const img = document.createElement("img");
  const prev = document.createElement("button");
  const next = document.createElement("button");
  prev.className = "g-btn prev"; prev.innerText = "‹";
  next.className = "g-btn next"; next.innerText = "›";
  function update() { img.src = "images/" + c.photos[gIndex]; }
  prev.addEventListener("click", function () { gIndex = (gIndex - 1 + c.photos.length) % c.photos.length; update(); });
  next.addEventListener("click", function () { gIndex = (gIndex + 1) % c.photos.length; update(); });
  g.appendChild(img); g.appendChild(prev); g.appendChild(next);
  update();
}

function renderVideo(c) {
  const v = document.getElementById("video");
  if (!c.video) { v.innerText = "영상을 준비 중입니다."; return; }
  v.innerHTML = '<iframe src="https://www.youtube.com/embed/' + c.video + '" allowfullscreen></iframe>';
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
