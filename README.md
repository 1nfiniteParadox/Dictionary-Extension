# Dictionary Chrome Extension

A Chrome extension that lets you quickly look up word definitions.

You can trigger definitions by:
- Selecting text and pressing **Alt + S**, or
- Selecting text and using the **right-click context menu** → Define "word".

---

## 🚀 Features
- Definitions appear in tooltips stacked neatly in the **top-right corner**.
- Works with both **Alt + S shortcut** and **right-click context menu**.
- Tooltips are draggable, closable, and copyable.
- Lightweight and easy to use.
- **Esc** key closes all tooltips.

---

## 🔧 Installation
Since this extension is not on the Chrome Web Store, you can install it manually:

1. **Download the repo**  
   - Click the green **Code** button on this page → **Download ZIP**.  
   - Extract the ZIP file.

2. **Open Chrome Extensions page**  
   - Go to `chrome://extensions/` in Chrome.  
   - Turn on **Developer mode** (toggle in the top-right corner).

3. **Load the extension**  
   - Click **Load unpacked**.  
   - Select the folder you extracted.

4. Done ✅ The extension is now installed.

---

## 📸 Demo
![Demo Image 1](/demoimg/Screenshot%202025-09-17%20141232.png)
![Demo Image 2](/demoimg/Screenshot%202025-09-17%20141350.png)

---

## ⚡️ Usage
- Highlight a word on any webpage.
- Press **Alt + S** → Tooltip with definition appears.  
- Or right-click highlighted text → Define "word".  

---

## 🛠 Tech
- JavaScript (content script + background service worker)
- Free Dictionary API: [https://dictionaryapi.dev/](https://dictionaryapi.dev/)

---

## 📜 License
MIT License. Free to use and modify.
