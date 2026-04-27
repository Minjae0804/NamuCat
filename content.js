chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract_paragraphs") {
    const sections = [];
    const headings = document.querySelectorAll(".wiki-heading");

    headings.forEach((heading, index) => {
      const title = heading.innerText.replace("[편집]", "").trim();
      let content = "";
      let nextElem = heading.nextElementSibling;
      while (nextElem && !nextElem.classList.contains("wiki-heading")) {
        content += nextElem.outerHTML;
        nextElem = nextElementSibling;
      }

      sections.push({ id: index, title, content });
    });

    sendResponse({ data: sections });
  }
});
