import { CONFIG } from './config.js';
let timer;
let [hours, minutes, seconds] = [0, 0, 0];
let isRunning = false;
let countdownMode = false;


// Function to create a notification
function showNotification() {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'puzzle128.png', 
        title: 'Nicoli Timer',
        message: 'Time is up!',
        priority: 2
    });
}

// Function to update timer
function updateTimer() {
    if (!isRunning) return;

    if (countdownMode) {       
        if (seconds === 0 && minutes === 0 && hours === 0) {
            stopTimer();
            showNotification();
            return;
        }

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
            seconds = 59;
            minutes--;
        } else if (hours > 0) {
            minutes = 59;
            seconds = 59;
            hours--;
        }
    } else {
        seconds++;
        if (seconds === 60) {
            seconds = 0;
            minutes++;
        }
        if (minutes === 60) {
            minutes = 0;
            hours++;
        }
    }

    chrome.runtime.sendMessage({
        type: 'TIMER_UPDATE',
        hours,
        minutes,
        seconds,
        isRunning
    });
}

// Start the timer
function startTimer(options = {}) {
    if (isRunning) return;

    isRunning = true;

    if (options.countdownMode !== undefined) countdownMode = options.countdownMode;
    if (options.hours !== undefined) hours = options.hours;
    if (options.minutes !== undefined) minutes = options.minutes;
    if (options.seconds !== undefined) seconds = options.seconds;

    // Start interval to update timer
    timer = setInterval(updateTimer, 1000);
}

// Stop the timer
function stopTimer() {
    clearInterval(timer);
    isRunning = false;
}

// Reset the timer
function resetTimer() {
    stopTimer();
    [hours, minutes, seconds] = [0, 0, 0];
    countdownMode = false;

    chrome.runtime.sendMessage({
        type: 'TIMER_RESET'
    });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'START_TIMER':
            startTimer(message.options);
            break;
        case 'STOP_TIMER':
            stopTimer();
            break;
        case 'RESET_TIMER':
            resetTimer();
            break;
    }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Extension Installed] Setting up context menus.");

  // Context menu for summarizing text
  chrome.contextMenus.create({
    id: "summarize",
    title: "Summarize Selected Text",
    contexts: ["selection"],
  });

  // Context menu for code explanation
  chrome.contextMenus.create({
    id: "code-explanation",
    title: "Explain Code",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "translate-page",
    title: "Translate Page",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "mock-interview",
    title: "Take a Mock Interview",
    contexts: ["page"],
    documentUrlPatterns: ["https://www.linkedin.com/in/*"] 
  });


});

  
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    console.log("[Context Menu Clicked] Info:", info, "Tab:", tab);
  
    if (info.menuItemId === "summarize" && info.selectionText) {
      console.log("[Selected Text]:", info.selectionText);
  
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: summarizeTextAndReplace,
        args: [info.selectionText]
      });
    }  
    else if (info.menuItemId === "code-explanation" && info.selectionText) {
      console.log("[Code Explanation Triggered]:", info.selectionText);
  
      chrome.storage.session.set({ lastCodeToExplain: info.selectionText });
  
      chrome.sidePanel.open({ tabId: tab.id });
      // chrome.runtime.sendMessage({ type: "START_CODE_EXPLANATION" });
    } 
    else if (info.menuItemId === "translate-page" && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: "show-translation-ui" });
    }
    else {
      console.warn("[No Text Selected]");
    }
  });
  
  function summarizeTextAndReplace(selectedText) {
    console.log("[Summarize] Summarizing text:", selectedText);
  
    if (!('ai' in self && 'summarizer' in self.ai)) {
      alert("Summarizer API is not supported in this browser.");
      return;
    }
  
    (async () => {
      try {
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
  
        console.log("[Summarizer Created]");
        const summary = await summarizer.summarize(selectedText);
        console.log("[Summary Generated]:", summary);
  
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
          container.replaceWith(document.createTextNode(selectedText));
        });
  
        container.appendChild(backButton);
  
        range.deleteContents();
        range.insertNode(container);
  
        console.log("[Replace] Original text replaced with summary.");
        summarizer.destroy();
      } catch (error) {
        console.error("[Error Summarizing Text]:", error);
      }
    })();
  }


chrome.runtime.onInstalled.addListener(() => {
  console.log("[Extension Installed] Setting up context menus.");

  chrome.contextMenus.create({
    id: "remove-ads",
    title: "Remove Unnecessary Ads",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "remove-ads" && tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "remove-ads" });
  }
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "mock-interview") {

      const profileUrl = info.pageUrl;
      console.log("[Profile URL]:", profileUrl);

      chrome.sidePanel.open({ tabId: tab.id });

      fetchLinkedInProfileData(profileUrl, tab);
  }
});

async function fetchLinkedInProfileData(profileUrl, tab) {
  const apiKey = CONFIG.SCRAPIN_API_KEY;  
  const apiEndpoint = `https://api.scrapin.io/enrichment/profile?apikey=${apiKey}&linkedInUrl=${profileUrl}`;

  try {
    console.log("[Sending Request to Scrapin API]");

    const response = await fetch(apiEndpoint, {
      method: 'GET',
    });

    const responseData = await response.json();
    console.log("[API Response Data]:", responseData);
    

    if (response.ok) {
      chrome.runtime.sendMessage({ type: 'START_MOCK_INTERVIEW', data: responseData});

    } else {
      console.error("Error fetching profile data:", response.statusText);
    }

  } catch (error) {
    console.error("Error fetching LinkedIn profile data:", error);
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'LINKEDIN_PROFILE_DATA') {
    console.log("[Received Profile Data in Background]:", message.data);
      chrome.sidePanel.setOptions({
          path: 'sidePanel.html'
      });

      chrome.runtime.sendMessage({ type: 'START_MOCK_INTERVIEW', data: message.data });
  }
});

