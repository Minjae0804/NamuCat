const loadBtn = document.getElementById("load-btn");
const urlInput = document.getElementById("target-url");
const sidebarList = document.getElementById("menu-list");
const contentBody = document.getElementById("content-body");
const docTitleDisplay = document.getElementById("doc-title-container");
const menuSearchInput = document.getElementById("menu-search");

// 문서 검색 및 로드
const initiateLoad = () => {
  let input = urlInput.value.trim();
  if (!input) return;

  document.title = `검색 중: ${input}...`;
  docTitleDisplay.innerText = "문서 찾는 중...";
  contentBody.innerHTML = "<h2>데이터를 가져오는 중...</h2>";
  sidebarList.innerHTML = "";

  let finalUrl = input.startsWith("http")
    ? input
    : `https://namu.wiki/w/${input
        .split("/")
        .map((p) => encodeURIComponent(p))
        .join("/")}`;
  chrome.runtime.sendMessage({ action: "fetch_url", url: finalUrl });
};

loadBtn.onclick = initiateLoad;
urlInput.onkeydown = (e) => {
  if (e.key === "Enter") initiateLoad();
};

menuSearchInput.oninput = () => {
  const query = menuSearchInput.value.toLowerCase();
  document.querySelectorAll(".menu-item").forEach((el) => {
    const matched = el.innerText.toLowerCase().includes(query);
    el.classList.toggle("search-hidden", !matched);
    if (query && matched) el.style.display = "flex";
  });
};

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "data_loaded") {
    const { docTitle, items } = message.data;
    sidebarList.innerHTML = "";

    if (!items || !items.length) {
      contentBody.innerHTML = "<h2>문서가 존재하지 않습니다.</h2>";
      docTitleDisplay.innerText = "검색 실패";
      return;
    }

    const finalTitle = docTitle || urlInput.value.trim();
    document.title = finalTitle;
    docTitleDisplay.innerText = finalTitle;
    contentBody.innerHTML = `<h1>${finalTitle}</h1><p>사이드바에서 문단을 선택하십시오.</p>`;

    items.forEach((item, index) => {
      const div = document.createElement("div");
      const level = parseInt(item.depth.replace("h", ""));
      div.className = `menu-item depth-${item.depth}`;
      div.dataset.level = level;

      const toggleBtn = document.createElement("span");
      toggleBtn.className = "toggle-btn";
      toggleBtn.innerText = "▾";
      const hasChild =
        items[index + 1] &&
        parseInt(items[index + 1].depth.replace("h", "")) > level;
      if (!hasChild) toggleBtn.style.visibility = "hidden";

      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        const isClosing = toggleBtn.innerText === "▾";
        toggleBtn.innerText = isClosing ? "▸" : "▾";
        let next = div.nextElementSibling;
        while (next && parseInt(next.dataset.level) > level) {
          next.style.display = isClosing ? "none" : "flex";
          next = next.nextElementSibling;
        }
      };

      const titleSpan = document.createElement("span");
      titleSpan.innerText = item.title;
      titleSpan.style.flex = "1";
      div.appendChild(toggleBtn);
      div.appendChild(titleSpan);

      div.onclick = () => {
        document
          .querySelectorAll(".menu-item")
          .forEach((el) => el.classList.remove("active"));
        div.classList.add("active");
        contentBody.innerHTML = `<h1>${item.title}</h1><hr>${item.content}`;
        document.getElementById("content-area").scrollTop = 0;
      };
      sidebarList.appendChild(div);
    });
  }
});
