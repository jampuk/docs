/**
 * diagram-viewer.js
 *
 * Client-side diagram rendering for docs pages (ported from the blog's
 * `src/pages/[...slug].astro` scripts).
 *
 * Docs code blocks are rendered by Expressive Code (EC):
 *
 *   <figure class="frame" data-language="mermaid">
 *     <figcaption>
 *       <span data-title>…</span>
 *       <button class="copy">…</button>
 *     </figcaption>
 *     <pre data-language="mermaid"><code>…</code></pre>
 *   </figure>
 *
 * This module:
 *  1. Detects diagram blocks (language "mermaid"/"c4", or keyword match on
 *     the raw code for plain/text fences) and appends a "Show Diagram"
 *     button directly below the code frame. Expressive Code keeps its
 *     <figcaption> hidden when a block has no title, so the button must live
 *     outside EC's managed DOM to stay rendered.
 *  2. Opens a fullscreen modal viewer that lazily loads Mermaid 11 from the
 *     jsdelivr CDN and renders the diagram to SVG. The modal supports:
 *       - Smooth pan & drag (touch/pointer)
 *       - Mousewheel zoom (free, no anchor)
 *       - Touch pinch-to-zoom
 *       - Zoom in (+), Zoom out (-), Reset (1:1), Fit to screen
 *       - Esc key or backdrop click to close
 *
 * The modal CSS lives in src/styles/custom.css (.diagram-modal*).
 */

(function () {
  var MERMAID_KEYWORDS = /^(C4(Context|Container|Component|Dynamic|Deployment)|graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(-v2)?|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|quadrantChart|sankey-beta|xychart-beta|packet-beta|kanban|architecture-beta)\b/m;
  var C4_KEYWORDS = /^C4(Context|Container|Component|Dynamic|Deployment)\b/m;

  function getRawCode(pre) {
    if (!pre) return "";
    var scope = pre.querySelector("code") || pre;

    // Strategy 1: Expressive Code per-line elements (.line / div[class*="line"]).
    var lines = scope.querySelectorAll(".line, div[class*='line']");
    if (lines.length > 0) {
      return Array.prototype.map
        .call(lines, function (line) {
          return line.textContent;
        })
        .join("\n")
        .replace(/\s+$/, "");
    }

    // Strategy 2: replace <br> tags with newlines, then strip markup.
    var html = scope.innerHTML || "";
    if (/<br\s*\/?>/i.test(html)) {
      return html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+$/, "");
    }

    // Strategy 3: plain textContent (may be single-line if EC stripped newlines).
    return (scope.textContent || "").trim();
  }

  function getLang(figure, pre) {
    var figLang = ((figure && figure.dataset && figure.dataset.language) || "").toLowerCase();
    var preLang = ((pre && pre.dataset && pre.dataset.language) || "").toLowerCase();
    return figLang || preLang;
  }

  function getDisplayLanguage(figure, pre) {
    var figLang = getLang(figure, pre);
    var raw = getRawCode(pre);
    if (figLang === "c4" || C4_KEYWORDS.test(raw)) return "c4";
    if (figLang === "mermaid" || MERMAID_KEYWORDS.test(raw)) return "mermaid";
    return figLang || "text";
  }

  function isDiagramBlock(figure, pre) {
    var lang = getLang(figure, pre);
    if (lang === "mermaid" || lang === "c4") return true;
    // Unlabeled/plain fences qualify only when the code itself looks like a
    // diagram definition (same rule as the blog).
    return MERMAID_KEYWORDS.test(getRawCode(pre));
  }

  function buildDiagramButton(figure, pre, lang) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ec-btn-diagram";
    btn.setAttribute("aria-label", "Show rendered diagram in modal");
    btn.title = "Show rendered diagram in modal";
    btn.textContent = "Show Diagram";
    btn.addEventListener("click", function (e) {
      // Expressive Code attaches delegated click handling in this toolbar
      // container; stop our click from reaching it (EC throws on unknown
      // buttons: "can't access property 'replace', a.code is undefined").
      e.stopPropagation();
      document.dispatchEvent(
        new CustomEvent("diagram:open", {
          detail: {
            pre: pre,
            figure: figure,
            lang: lang,
            triggerBtn: btn,
          },
        }),
      );
    });

    // ── Placement ──────────────────────────────────────────────────────────
    // Expressive Code renders its copy button as an absolutely positioned
    // element inside <figure class="frame">, and <figcaption> is `display: none`
    // when the block has no title. Injecting there yields a 0x0 button.
    // Place the button as a sibling right after <figure> in normal document
    // flow — always rendered, never clipped by EC's toolbar.
    if (figure && figure.parentNode) {
      figure.parentNode.insertBefore(btn, figure.nextSibling);
      btn.classList.add("ec-btn-diagram--below");
    } else if (pre.parentNode) {
      pre.parentNode.insertBefore(btn, pre);
    }

    // Mark the figure so re-runs do not create a second button.
    if (figure) figure.setAttribute("data-diagram-btn", "true");
    createdButtons.push(btn);

    return btn;
  }

  // ─── Placement helpers ───────────────────────────────────────────────────

  // Every button we create is tracked so we can drop orphans whose figure was
  // replaced by Expressive Code during a re-render.
  var createdButtons = [];

  function pruneOrphanButtons() {
    createdButtons = createdButtons.filter(function (b) {
      if (document.body.contains(b)) return true;
      b.remove();
      return false;
    });
  }

  // Re-attach buttons after Expressive Code hydrates/re-renders code blocks.
  // EC may replace the figure DOM after our initial DOMContentLoaded run,
  // wiping injected buttons; this observer watches for new figures and
  // re-injects any missing "Show Diagram" buttons.
  var observer = null;

  function startDiagramObserver() {
    if (observer) return;
    observer = new MutationObserver(function (mutations) {
      var needsReattach = false;
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches("figure.frame")) needsReattach = true;
          if (node.querySelectorAll && node.querySelectorAll("figure.frame").length > 0)
            needsReattach = true;
        });
      });
      if (needsReattach) {
        initDiagramButtons();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function initDiagramButtons() {
    pruneOrphanButtons();

    document.querySelectorAll(".sl-markdown-content pre").forEach(function (pre) {
      var figure = pre.closest("figure");
      // Already enhanced? The marker survives even when the button was
      // relocated outside the figure by the verification fallback.
      if (figure && figure.getAttribute("data-diagram-btn") === "true") return;
      if (figure && figure.querySelector(".ec-btn-diagram")) return;
      if (!isDiagramBlock(figure, pre)) return;
      buildDiagramButton(figure, pre, getDisplayLanguage(figure, pre));
    });

    startDiagramObserver();
  }

  // ─── Mermaid lazy loader & Fullscreen Modal Viewer ────────────────────────

  var mermaidReady = null;

  function loadMermaid() {
    if (mermaidReady) return mermaidReady;
    mermaidReady = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.type = "module";
      script.textContent = [
        "import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';",
        "mermaid.initialize({",
        "  startOnLoad: false,",
        "  theme: 'dark',",
        "  themeVariables: {",
        "    background: '#0B132B',",
        "    primaryColor: '#1C2541',",
        "    primaryTextColor: '#E2E8F0',",
        "    primaryBorderColor: '#334155',",
        "    lineColor: '#94A3B8',",
        "    secondaryColor: '#1E293B',",
        "    tertiaryColor: '#0EA5E9',",
        "    edgeLabelBackground: '#1C2541',",
        "    clusterBkg: '#1C2541',",
        "    titleColor: '#F59E0B',",
        "    attributeBackgroundColorEven: '#1C2541',",
        "    attributeBackgroundColorOdd: '#0B132B',",
        "  },",
        "  fontFamily: '\"Fira Code\", \"Space Grotesk\", monospace',",
        "  c4: { diagramMarginY: 30 },",
        "});",
        "window.__mermaid = mermaid;",
        "document.dispatchEvent(new Event('mermaid:ready'));",
      ].join("\n");
      document.head.appendChild(script);

      document.addEventListener("mermaid:ready", function () { resolve(); }, { once: true });
      window.setTimeout(function () {
        reject(new Error("Mermaid load timeout"));
      }, 15000);
    });
    return mermaidReady;
  }

  var diagramSeq = 0;
  var modalEl = null;
  var titleEl = null;
  var scaleBadge = null;
  var viewportEl = null;
  var contentEl = null;
  var loadingEl = null;
  var activeSvg = null;

  // Transform state
  var scale = 1;
  var translateX = 0;
  var translateY = 0;

  function updateTransform() {
    if (!contentEl) return;
    contentEl.style.transform =
      "translate(calc(-50% + " + translateX + "px), calc(-50% + " + translateY + "px)) scale(" + scale + ")";
    if (scaleBadge) {
      scaleBadge.textContent = Math.round(scale * 100) + "%";
    }
  }

  function zoomBy(factor) {
    scale = Math.min(Math.max(Number((scale * factor).toFixed(2)), 0.15), 6.0);
    updateTransform();
  }

  function getSvgIntrinsicDimensions(svg) {
    if (!svg) return { width: 800, height: 600 };

    // 1. Check viewBox attribute
    var vbAttr = svg.getAttribute("viewBox");
    if (vbAttr) {
      var parts = vbAttr.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        return { width: parts[2], height: parts[3] };
      }
    }

    // 2. Check viewBox DOM property
    if (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width > 0) {
      return {
        width: svg.viewBox.baseVal.width,
        height: svg.viewBox.baseVal.height,
      };
    }

    // 3. Check getBBox
    try {
      var bbox = svg.getBBox();
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        return { width: bbox.width, height: bbox.height };
      }
    } catch (_) {}

    // 4. Fallback to width/height attributes or getBoundingClientRect
    var w = parseFloat(svg.getAttribute("width")) || svg.clientWidth || 800;
    var h = parseFloat(svg.getAttribute("height")) || svg.clientHeight || 600;
    return { width: w, height: h };
  }

  function fitDiagram() {
    if (!activeSvg || !viewportEl) return;
    var vpRect = viewportEl.getBoundingClientRect();
    var dims = getSvgIntrinsicDimensions(activeSvg);
    var svgW = dims.width;
    var svgH = dims.height;

    // Apply intrinsic dimensions to SVG element so it scales smoothly
    activeSvg.style.width = svgW + "px";
    activeSvg.style.height = svgH + "px";
    activeSvg.style.maxWidth = "none";
    activeSvg.style.maxHeight = "none";

    // Margins around the diagram inside the viewport
    var padX = 48;
    var padY = 48;
    var availW = Math.max(vpRect.width - padX, 100);
    var availH = Math.max(vpRect.height - padY, 100);

    // Calculate scale to consume maximum viewport space (either full width or full height)
    var fitScale = Math.min(availW / svgW, availH / svgH);
    scale = Math.min(Math.max(Number(fitScale.toFixed(2)), 0.1), 10.0);
    translateX = 0;
    translateY = 0;
    updateTransform();
  }

  function resetDiagram() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    updateTransform();
  }

  function createModal() {
    if (modalEl) return;

    modalEl = document.createElement("div");
    modalEl.className = "diagram-modal";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-label", "Diagram Viewer");

    var dialog = document.createElement("div");
    dialog.className = "diagram-modal-dialog";

    // Header
    var header = document.createElement("div");
    header.className = "diagram-modal-header";

    titleEl = document.createElement("div");
    titleEl.className = "diagram-modal-title";
    titleEl.textContent = "Diagram Viewer";
    header.appendChild(titleEl);

    var controls = document.createElement("div");
    controls.className = "diagram-modal-controls";

    var btnZoomOut = document.createElement("button");
    btnZoomOut.type = "button";
    btnZoomOut.className = "diagram-icon-btn";
    btnZoomOut.title = "Zoom out (−)";
    btnZoomOut.textContent = "−";
    btnZoomOut.addEventListener("click", function () { zoomBy(0.8); });
    controls.appendChild(btnZoomOut);

    scaleBadge = document.createElement("span");
    scaleBadge.className = "diagram-modal-scale-badge";
    scaleBadge.textContent = "100%";
    scaleBadge.title = "Click to reset to 100%";
    scaleBadge.style.cursor = "pointer";
    scaleBadge.addEventListener("click", resetDiagram);
    controls.appendChild(scaleBadge);

    var btnZoomIn = document.createElement("button");
    btnZoomIn.type = "button";
    btnZoomIn.className = "diagram-icon-btn";
    btnZoomIn.title = "Zoom in (+)";
    btnZoomIn.textContent = "+";
    btnZoomIn.addEventListener("click", function () { zoomBy(1.25); });
    controls.appendChild(btnZoomIn);

    var btnFit = document.createElement("button");
    btnFit.type = "button";
    btnFit.className = "diagram-icon-btn";
    btnFit.title = "Fit diagram to screen";
    btnFit.textContent = "Fit";
    btnFit.addEventListener("click", fitDiagram);
    controls.appendChild(btnFit);

    var btnClose = document.createElement("button");
    btnClose.type = "button";
    btnClose.className = "diagram-icon-btn";
    btnClose.title = "Close (Esc)";
    btnClose.textContent = "✕";
    btnClose.addEventListener("click", closeModal);
    controls.appendChild(btnClose);

    header.appendChild(controls);
    dialog.appendChild(header);

    // Viewport
    viewportEl = document.createElement("div");
    viewportEl.className = "diagram-modal-viewport";

    contentEl = document.createElement("div");
    contentEl.className = "diagram-modal-content";
    viewportEl.appendChild(contentEl);

    loadingEl = document.createElement("div");
    loadingEl.className = "diagram-modal-loading";
    loadingEl.textContent = "Rendering diagram…";
    viewportEl.appendChild(loadingEl);

    var hints = document.createElement("div");
    hints.className = "diagram-modal-hints";
    hints.textContent = "Drag to pan • Scroll to zoom • Esc to close";
    viewportEl.appendChild(hints);

    dialog.appendChild(viewportEl);
    modalEl.appendChild(dialog);
    document.body.appendChild(modalEl);

    // Backdrop click to close
    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) closeModal();
    });

    // Keyboard navigation
    window.addEventListener("keydown", function (e) {
      if (!modalEl || !modalEl.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        closeModal();
      } else if (e.key === "+" || e.key === "=") {
        zoomBy(1.2);
      } else if (e.key === "-" || e.key === "_") {
        zoomBy(0.8);
      } else if (e.key === "0") {
        resetDiagram();
      }
    });

    // ── Pan & Drag Engine ──
    var isPanning = false;
    var startX = 0;
    var startY = 0;
    var initX = 0;
    var initY = 0;
    var activePointers = new Map();
    var initialDistance = 0;
    var initialScale = 1;

    viewportEl.addEventListener("pointerdown", function (e) {
      activePointers.set(e.pointerId, e);
      if (activePointers.size === 1) {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        isPanning = true;
        startX = e.clientX;
        startY = e.clientY;
        initX = translateX;
        initY = translateY;
        viewportEl.classList.add("is-panning");
        try { viewportEl.setPointerCapture(e.pointerId); } catch (_) {}
      } else if (activePointers.size === 2) {
        isPanning = false;
        viewportEl.classList.remove("is-panning");
        var pts = Array.from(activePointers.values());
        initialDistance = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
        initialScale = scale;
      }
    });

    viewportEl.addEventListener("pointermove", function (e) {
      activePointers.set(e.pointerId, e);
      if (activePointers.size === 2 && initialDistance > 0) {
        var pts = Array.from(activePointers.values());
        var currentDist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
        var factor = currentDist / initialDistance;
        scale = Math.min(Math.max(Number((initialScale * factor).toFixed(2)), 0.15), 6.0);
        updateTransform();
        return;
      }

      if (!isPanning) return;
      translateX = initX + (e.clientX - startX);
      translateY = initY + (e.clientY - startY);
      updateTransform();
    });

    function handlePointerEnd(e) {
      activePointers.delete(e.pointerId);
      if (activePointers.size === 0) {
        isPanning = false;
        viewportEl.classList.remove("is-panning");
        try { viewportEl.releasePointerCapture(e.pointerId); } catch (_) {}
      } else if (activePointers.size === 1) {
        var remaining = Array.from(activePointers.values())[0];
        startX = remaining.clientX;
        startY = remaining.clientY;
        initX = translateX;
        initY = translateY;
        isPanning = true;
      }
    }

    viewportEl.addEventListener("pointerup", handlePointerEnd);
    viewportEl.addEventListener("pointercancel", handlePointerEnd);

    // ── Mousewheel Zoom ──
    viewportEl.addEventListener("wheel", function (e) {
      e.preventDefault();
      var factor = e.deltaY < 0 ? 1.15 : 0.87;
      scale = Math.min(Math.max(Number((scale * factor).toFixed(2)), 0.15), 6.0);
      updateTransform();
    }, { passive: false });
  }

  var lastActiveTrigger = null;

  function openModal(triggerBtn) {
    lastActiveTrigger = triggerBtn || null;
    createModal();
    modalEl.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove("is-open");
    document.body.style.overflow = "";
    if (lastActiveTrigger && typeof lastActiveTrigger.focus === "function") {
      try { lastActiveTrigger.focus(); } catch (_) {}
    }
  }

  // Re-fit diagram if viewport resizes while modal is active
  window.addEventListener("resize", function () {
    if (modalEl && modalEl.classList.contains("is-open")) {
      fitDiagram();
    }
  });

  // Listen to diagram:open dispatched by "Show Diagram" buttons
  document.addEventListener("diagram:open", function (e) {
    var detail = (e && e.detail) || {};
    var pre = detail.pre;
    var lang = detail.lang || "mermaid";
    var triggerBtn = detail.triggerBtn;

    if (!pre) return;
    var rawCode = getRawCode(pre);

    if (triggerBtn) {
      triggerBtn.textContent = "Loading…";
      triggerBtn.disabled = true;
    }

    openModal(triggerBtn);
    contentEl.innerHTML = "";
    loadingEl.style.display = "flex";

    // Extract title if present in diagram text
    var titleMatch = rawCode.match(/^title\s+(.+)$/m);
    var label = titleMatch
      ? "DIAGRAM // " + titleMatch[1].trim()
      : "DIAGRAM VIEWER // " + lang.toUpperCase();
    if (titleEl) titleEl.textContent = label;

    loadMermaid().then(function () {
      var id = "diagram-modal-" + (++diagramSeq);
      return window.__mermaid.render(id, rawCode);
    }).then(function (result) {
      loadingEl.style.display = "none";
      contentEl.innerHTML = result.svg;
      activeSvg = contentEl.querySelector("svg");
      fitDiagram();

      if (triggerBtn) {
        triggerBtn.textContent = "Show Diagram";
        triggerBtn.disabled = false;
      }
    }).catch(function (err) {
      loadingEl.style.display = "none";
      closeModal();
      if (triggerBtn) {
        triggerBtn.textContent = "Show Diagram";
        triggerBtn.disabled = false;
      }
      console.error("[diagram-viewer] render error:", err);
    });
  });

  // Module scripts run after the DOM is parsed; keep a readyState guard for safety.
  // Also re-run after a short delay: Expressive Code may hydrate/re-render code
  // blocks after DOMContentLoaded, which would wipe injected buttons.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initDiagramButtons();
      window.setTimeout(initDiagramButtons, 300);
    });
  } else {
    initDiagramButtons();
    window.setTimeout(initDiagramButtons, 300);
  }
})();
