(() => {
  console.log("Inline-dict: content script loaded");

  // --- Inject CSS ---
  if (!document.getElementById("inline-dict-styles")) {
    const style = document.createElement("style");
    style.id = "inline-dict-styles";
    style.textContent = `
.inline-dict-tooltip {
  position: fixed;
  background: #222;
  color: #fff;
  padding: 8px 100px 8px 12px;
  border-radius: 8px;
  width: 320px;
  z-index: 2147483647;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  transition: top 250ms ease, opacity 200ms ease, transform 200ms ease;
  user-select: text;
  cursor: default;
  right: 15px;
}
.inline-dict-tooltip strong { font-weight: 700; }
.inline-dict-tooltip:hover { 
  transform: translateY(-4px); 
  box-shadow: 0 8px 20px rgba(0,0,0,0.35);
}
.inline-dict-close-btn,
.inline-dict-drag-btn,
.inline-dict-copy-btn {
  position: absolute;
  top: 6px;
  font-size: 14px;
  font-weight: 700;
  user-select: none;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255,255,255,0.08);
}
.inline-dict-close-btn { right: 8px; color: #aaa; cursor: pointer; }
.inline-dict-close-btn:hover { color: #fff; background: rgba(255,255,255,0.2); }
.inline-dict-drag-btn { right: 38px; color: #aaa; cursor: grab; }
.inline-dict-drag-btn:active { cursor: grabbing; background: rgba(255,255,255,0.2); }
.inline-dict-copy-btn { right: 68px; color: #aaa; cursor: pointer; }
.inline-dict-copy-btn:hover { color: #fff; background: rgba(255,255,255,0.2); }
.inline-dict-tooltip--closing { opacity: 0; transform: translateY(-10px); }
`;
    document.head.appendChild(style);
  }

  const margin = 12;
  const stack = [];

  function createTooltip(word, meaning) {
    if (!word) return;

    const tooltip = document.createElement("div");
    tooltip.className = "inline-dict-tooltip";

    // --- Text content ---
    const textWrap = document.createElement("div");
    textWrap.style.fontWeight = "500";
    const strong = document.createElement("strong");
    strong.textContent = word;
    textWrap.appendChild(strong);
    textWrap.appendChild(document.createTextNode(`: ${meaning}`));
    tooltip.appendChild(textWrap);

    // --- Close button ---
    const closeBtn = document.createElement("span");
    closeBtn.className = "inline-dict-close-btn";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      tooltip.classList.add("inline-dict-tooltip--closing");
      const idx = stack.indexOf(tooltip);
      if (idx !== -1) {
        stack.splice(idx, 1);
        shiftStackUp();
      }
      setTimeout(() => tooltip.remove(), 200);
    });
    tooltip.appendChild(closeBtn);

    // --- Copy button ---
    const copyBtn = document.createElement("span");
    copyBtn.className = "inline-dict-copy-btn";
    copyBtn.title = "Copy definition";
    copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path d="M10 1.5a.5.5 0 0 1 .5.5v1H11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h.5v-1a.5.5 0 0 1 .5-.5h4zM5.5 3A1.5 1.5 0 0 0 4 4.5v7A1.5 1.5 0 0 0 5.5 13h5A1.5 1.5 0 0 0 12 11.5v-7A1.5 1.5 0 0 0 10.5 3h-5z"/>
    </svg>`;
    copyBtn.style.display = "flex";
    copyBtn.style.alignItems = "center";
    copyBtn.style.justifyContent = "center";
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(`${word}: ${meaning}`).then(() => {
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.485 1.929a.75.75 0 0 1 0 1.06L6.53 10.944a.75.75 0 0 1-1.06 0L2.515 7.99a.75.75 0 1 1 1.06-1.06L6 9.354l6.425-6.425a.75.75 0 0 1 1.06 0z"/>
        </svg>`;
        setTimeout(() => copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M10 1.5a.5.5 0 0 1 .5.5v1H11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h.5v-1a.5.5 0 0 1 .5-.5h4zM5.5 3A1.5 1.5 0 0 0 4 4.5v7A1.5 1.5 0 0 0 5.5 13h5A1.5 1.5 0 0 0 12 11.5v-7A1.5 1.5 0 0 0 10.5 3h-5z"/>
        </svg>`, 1000);
      }).catch(() => {
        copyBtn.style.color = "red";
        setTimeout(() => copyBtn.style.color = "#aaa", 1000);
      });
    });
    tooltip.appendChild(copyBtn);

    // --- Drag button ---
    const dragBtn = document.createElement("span");
    dragBtn.className = "inline-dict-drag-btn";
    dragBtn.textContent = "⠿";
    tooltip.appendChild(dragBtn);

    document.body.appendChild(tooltip);

    let topMargin = stack.length === 0 ? 4 : margin;
    tooltip.style.top = `${topMargin}px`;

    stack.push(tooltip);
    shiftStackUp();

    // --- Dragging ---
    let isDragging = false, startY = 0, startTop = 0;
    dragBtn.addEventListener("mousedown", (e) => {
      isDragging = true;
      startY = e.clientY;
      startTop = parseInt(tooltip.style.top);
      tooltip.style.transition = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      e.preventDefault();
    });
    const onMouseMove = (e) => {
      if (!isDragging) return;
      let newTop = startTop + (e.clientY - startY);
      newTop = Math.max(margin, Math.min(newTop, window.innerHeight - tooltip.offsetHeight - margin));
      tooltip.style.top = `${newTop}px`;
      const idx = stack.indexOf(tooltip);
      if (idx > 0 && newTop < parseInt(stack[idx - 1].style.top)) {
        [stack[idx - 1], stack[idx]] = [stack[idx], stack[idx - 1]];
        shiftStackUp();
      } else if (idx < stack.length - 1 && newTop > parseInt(stack[idx + 1].style.top)) {
        [stack[idx + 1], stack[idx]] = [stack[idx], stack[idx + 1]];
        shiftStackUp();
      }
    };
    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      tooltip.style.transition = "top 250ms ease, opacity 200ms ease, transform 200ms ease";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      shiftStackUp();
    };
  }

  function shiftStackUp() {
    let top = margin;
    stack.forEach(t => {
      t.style.top = `${top}px`;
      top += t.offsetHeight + 10;
    });
  }

  // ESC closes all tooltips
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      stack.forEach(t => {
        t.classList.add("inline-dict-tooltip--closing");
        setTimeout(() => t.remove(), 200);
      });
      stack.length = 0;
    }
  });

  // Listen for background messages (both context menu + shortcut)
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.action === "showDefinition") {
      createTooltip(msg.word, msg.meaning);
    }
  });

  // Debug helper
  window.__inlineDictDebugShow = (w, m) => createTooltip(w || "test", m || "sample definition");
})();
