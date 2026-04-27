chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "viewer.html" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetch_url") {
    chrome.tabs.create({ url: message.url, active: false }, (newTab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === newTab.id && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.scripting
            .executeScript({
              target: { tabId: newTab.id },
              func: extractNamuData,
            })
            .then((results) => {
              const data = results[0].result || { docTitle: "", items: [] };
              chrome.runtime.sendMessage({ action: "data_loaded", data: data });
              chrome.tabs.remove(newTab.id);
            });
        }
      });
    });
  }
});

function extractNamuData() {
  const mainTitleEl = document.querySelector("h1._2HZC0kyI");
  const docTitle = mainTitleEl ? mainTitleEl.innerText.trim() : "";
  const container = document.querySelector(
    ".oqcKqeal.GilcywCf.ogJzgyEm.PkJRN10H",
  );

  if (!container) return { docTitle, items: [] };

  const items = [];
  const children = Array.from(container.children);

  for (let i = 0; i < children.length; i++) {
    const currentEl = children[i];
    if (currentEl.classList.contains("R4Gr+0p4")) {
      const hTag = currentEl.querySelector("h1, h2, h3, h4, h5, h6");
      const title = hTag
        ? hTag.innerText.replace("[편집]", "").trim()
        : "제목 없음";
      const depth = hTag ? hTag.tagName.toLowerCase() : "h2";

      let contentHtml = "문단 내용이 존재하지 않습니다.";
      for (let j = i + 1; j < children.length; j++) {
        const nextSibling = children[j];
        if (nextSibling.classList.contains("R4Gr+0p4")) break;
        const contentNode =
          nextSibling.querySelector(".HfahiVNq") ||
          (nextSibling.classList.contains("HfahiVNq") ? nextSibling : null);
        if (contentNode) {
          const clone = contentNode.cloneNode(true);
          clone.querySelectorAll("img").forEach((img) => {
            const src = img.getAttribute("data-src") || img.getAttribute("src");
            if (src) img.src = src.startsWith("//") ? "https:" + src : src;
          });
          contentHtml = clone.innerHTML;
          i = j;
          break;
        }
      }
      items.push({ title, content: contentHtml, depth });
    }
  }
  return { docTitle, items };
}
