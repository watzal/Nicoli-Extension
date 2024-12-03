console.log('Content script loaded');

async function summarizeText(selectedText) {
  console.log("[Summarize] Summarizing text:", selectedText);

  try {
    if (!('ai' in self && 'summarizer' in self.ai)) {
      alert("Summarizer API is not supported in this browser.");
      return;
    }

    const capabilities = await self.ai.summarizer.capabilities();
    console.log("[Summarizer Capabilities]:", capabilities);

    if (capabilities.available === "no") {
      alert("Summarizer API is not ready for use.");
      return;
    }

    const summarizer = await self.ai.summarizer.create({
      type: "tl;dr",
      format: "plain-text",
      length: "medium",
    });

    const summary = await summarizer.summarize(selectedText);
    console.log("[Summary]:", summary);

    replaceTextWithSummary(selectedText, summary);

    summarizer.destroy();
  } catch (error) {
    console.error("[Summarize Error]:", error);
  }
}
function replaceTextWithSummary(originalText, summary) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);

  const container = document.createElement("span");
  container.style.backgroundColor = "lightyellow";
  container.style.border = "1px solid black";
  container.style.padding = "2px";

  const summaryText = document.createElement("span");
  summaryText.textContent = summary;
  container.appendChild(summaryText);

  const backButton = document.createElement("button");
  backButton.textContent = "Back";
  backButton.style.marginLeft = "8px";
  backButton.style.padding = "2px";
  backButton.style.fontSize = "12px";
  backButton.style.cursor = "pointer";

  backButton.addEventListener("click", () => {
    container.replaceWith(document.createTextNode(originalText));
  });

  container.appendChild(backButton);

  range.deleteContents();
  range.insertNode(container);

  console.log("[Replace] Original text replaced with summary.");
}


console.log("[Content Script Loaded]");
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Message Received in Content Script] Request:", request);

  if (request.action === "highlight" && request.text) {
    console.log("[Action: Highlight Key Points] Selected Text:", request.text);

    highlightImportantSentences(request.text);

    // Send a response back to the background script
    sendResponse({ success: true, message: "Highlighting initiated." });
  } else {
    console.error("[Invalid Action] Request:", request);
    sendResponse({ success: false, message: "Invalid action or missing text." });
  }
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "remove-ads") {
    removeAds();
  } else {
    console.error("[Invalid Action] Request:", request);
  }
});

function removeAds() {
  console.log("[Ad Removal] Cleaning the page...");
  const adSelectors = [
    'iframe',                // Ad iframes
    '[id*="ad"]',            // IDs containing "ad"
    '[class*="ad"]',         // Classes containing "ad"
    '[class*="banner"]',     // Banner ads
    '[class*="popup"]',      // Popups
    '[class*="sponsor"]',    // Sponsored content
    '[class*="sidebar"]',    // Sidebar ads
    '[class*="overlay"]',    // Overlay ads
    '[class*="modal"]'       // Modal ads
  ];

  adSelectors.forEach(selector => {
    const ads = document.querySelectorAll(selector);
    ads.forEach(ad => ad.remove());
  });

  console.log("[Ad Removal Complete] Ads removed from the page.");
}
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "show-translation-ui") {
    showTranslationUI();
  }
});

function showTranslationUI() {
  console.log("[UI] Showing translation UI...");

  if (document.getElementById("translation-ui")) {
    return;
  }

  const container = document.createElement("div");
  container.id = "translation-ui";
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  container.style.padding = "10px";
  container.style.backgroundColor = "#043383";
  container.style.border = "1px solid #40dba4";
  container.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  // container.style.color = "#40dba4"
  container.style.zIndex = "10000";

  const dropdown = document.createElement("select");
  dropdown.id = "language-selector";
  dropdown.style.marginRight = "10px";
  dropdown.style.backgroundColor = "#40dba4";
  dropdown.style.color = "#043383";
  dropdown.style.fontSize = "14px";
  dropdown.style.fontWeight = "bold";
  dropdown.style.cursor = "pointer";
  dropdown.innerHTML = `
    <option value="en">English</option>
    <option value="zh">Chinese</option>
    <option value="fr">French</option>
    <option value="hi">Hindi</option>
    <option value="es">Spanish</option>
  `;

  // Create a translate button
  const translateButton = document.createElement("button");
  translateButton.innerText = "Translate";
  translateButton.style.padding = "5px 10px";
  translateButton.style.backgroundColor = "#40dba4";
  translateButton.style.color = "#043383"; 
  translateButton.style.fontSize = "14px";
  translateButton.style.cursor = "pointer";

  // Add event listener to the translate button
  translateButton.addEventListener("click", async () => {
    const targetLanguage = dropdown.value;
    console.log("[UI] Translate button clicked. Target language:", targetLanguage);
    await detectAndTranslate(targetLanguage);
    container.remove(); 
  });

  // Create a close button
  const closeButton = document.createElement("button");
  closeButton.innerText = "Close";
  closeButton.style.marginLeft = "10px";
  closeButton.style.padding = "5px 10px";
  closeButton.style.backgroundColor = "#40dba4"; 
  closeButton.style.color = "#043383"; 
  closeButton.style.fontSize = "14px";
  closeButton.style.cursor = "pointer";

  // Add event listener to the close button
  closeButton.addEventListener("click", () => {
    console.log("[UI] Close button clicked.");
    container.remove();
  });

  // Append elements to the container
  container.appendChild(dropdown);
  container.appendChild(translateButton);
  container.appendChild(closeButton);
  document.body.appendChild(container);
}

async function detectAndTranslate(targetLanguage) {
  console.log("[Translation] Detecting language and translating to:", targetLanguage);

  const sourceLanguage = await detectLanguage();
  if (!sourceLanguage) {
    alert("Unable to detect the source language.");
    return;
  }

  console.log(`[Detected Language]: ${sourceLanguage}`);

  await translatePage(sourceLanguage, targetLanguage);
}

async function detectLanguage() {
  try {
    const canDetect = await translation.canDetect();
    if (canDetect === 'no') {
      console.error("Language detection is not available.");
      return null;
    }

    let detector;
    if (canDetect === 'readily') {
      detector = await translation.createDetector();
    } else {
      detector = await translation.createDetector();
      detector.addEventListener('downloadprogress', (e) => {
        console.log(e.loaded, e.total);
      });
      await detector.ready;
    }

    const textContent = document.body.innerText.trim();
    console.log(textContent);
    if (!textContent) {
      console.log("No text found on the page for language detection.");
      return null;
    }

    const results = await detector.detect(textContent);
    console.log("the results are",results);

    const topResult = results[0];
    console.log(`Detected language: ${topResult.detectedLanguage} (Confidence: ${topResult.confidence})`);
    return topResult.detectedLanguage;
  } catch (error) {
    console.error("[Language Detection Error]:", error);
    return null;
  }
}

async function translatePage(sourceLanguage, targetLanguage) {
  console.log(`[Translation] Translating from ${sourceLanguage} to ${targetLanguage}...`);

  if (!('translation' in self && 'createTranslator' in self.translation)) {
    alert("Translator API is not supported in this browser.");
    return;
  }

  const canTranslate = await self.translation.canTranslate({
    sourceLanguage: sourceLanguage,
    targetLanguage: targetLanguage,
  });

  if (canTranslate !== "readily" && canTranslate !== "after-download") {
    alert("The selected language pair is not supported.");
    return;
  }

  if (canTranslate === "after-download") {
    console.log("Downloading language pack...");
  }

  const translator = await self.translation.createTranslator({
    sourceLanguage: sourceLanguage,
    targetLanguage: targetLanguage,
  });

  const textNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  for (const textNode of textNodes) {
    const originalText = textNode.nodeValue.trim();
    if (originalText) {
      try {
        const translatedText = await translator.translate(originalText);
        textNode.nodeValue = translatedText;
      } catch (error) {
        console.error("[Translation Error]:", error);
      }
    }
  }

  translator.destroy(); 
  console.log("[Translation Complete] Page translated to", targetLanguage);
}
