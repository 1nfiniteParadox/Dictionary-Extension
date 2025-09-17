// background.js (MV3 service worker)

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "inline-dict-define",
    title: "Define '%s'",
    contexts: ["selection"]
  });
});

// Fetch definition from dictionary API
async function fetchDefinition(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = await res.json();
    if (Array.isArray(data) && data[0].meanings && data[0].meanings[0].definitions) {
      return data[0].meanings[0].definitions[0].definition;
    } else {
      return "No definition found";
    }
  } catch (err) {
    return "Error fetching definition";
  }
}

// Context menu handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "inline-dict-define" && info.selectionText) {
    const word = info.selectionText.trim();
    const meaning = await fetchDefinition(word);

    chrome.tabs.sendMessage(tab.id, {
      action: "showDefinition",
      word,
      meaning
    });
  }
});

// Keyboard shortcut (Alt+S)
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === "lookup-selection") {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: () => window.getSelection().toString().trim()
      },
      async (results) => {
        if (!results || !results[0].result) return;
        const word = results[0].result;
        const meaning = await fetchDefinition(word);

        chrome.tabs.sendMessage(tab.id, {
          action: "showDefinition",
          word,
          meaning
        });
      }
    );
  }
});
