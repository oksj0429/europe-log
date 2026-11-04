// 아코디언: items = [{title, sub, body}]
function buildAccordion(el, items) {
  items.forEach(function (it) {
    const box = document.createElement("div");
    box.className = "acc";
    const btn = document.createElement("button");
    btn.innerHTML = it.title + (it.sub ? "<small>" + it.sub + "</small>" : "");
    const body = document.createElement("div");
    body.className = "body";
    body.innerText = it.body;
    btn.addEventListener("click", function () { box.classList.toggle("open"); });
    box.appendChild(btn); box.appendChild(body);
    el.appendChild(box);
  });
}
