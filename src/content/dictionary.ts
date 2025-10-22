/**
 * Dictionary Content Script
 * Shows Wikipedia-style popup on text selection with definition and image
 */

// Types for API responses
interface WikipediaExtract {
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  pageurl?: string;
}

interface DictionaryDefinition {
  word: string;
  phonetic?: string;
  meanings?: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
    }>;
  }>;
}

class DictionaryPopup {
  private popup: HTMLDivElement | null = null;
  private selectedText: string = "";
  private controller: AbortController | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Listen for text selection
    document.addEventListener("mouseup", (e) => this.handleTextSelection(e));
    document.addEventListener("keyup", (e) => this.handleTextSelection(e));

    // Close popup on click outside or ESC key
    document.addEventListener("mousedown", (e) => this.handleClickOutside(e));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.hidePopup();
    });
  }

  private async handleTextSelection(e: MouseEvent | KeyboardEvent) {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    // Only process if there's selected text and it's a single word or short phrase
    if (!text || text.length < 2 || text.length > 50) {
      this.hidePopup();
      return;
    }

    // Don't show if user is selecting inside the popup itself
    if (this.popup && this.popup.contains(e.target as Node)) {
      return;
    }

    this.selectedText = text;

    // Get surrounding context for better definition matching
    const context = this.getContext(selection);

    // Cancel previous fetch if still running
    if (this.controller) {
      this.controller.abort();
    }
    this.controller = new AbortController();

    // Show loading state
    this.showLoadingPopup(e);

    try {
      // Fetch data from both APIs in parallel
      const [wikiData, dictData] = await Promise.all([
        this.fetchWikipedia(text, this.controller.signal),
        this.fetchDictionary(text, this.controller.signal),
      ]);

      // Show popup with data
      this.showPopup(wikiData, dictData, context, e);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return; // Request was cancelled, do nothing
      }
      console.error("Error fetching data:", error);
      this.hidePopup();
    }
  }

  private async fetchWikipedia(
    text: string,
    signal: AbortSignal
  ): Promise<WikipediaExtract | null> {
    try {
      // Clean up the search text - capitalize first letter
      const searchTerm = text.charAt(0).toUpperCase() + text.slice(1);

      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        searchTerm
      )}`;

      const response = await fetch(url, { signal });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      // Check if it's a valid result (not a disambiguation page or error)
      if (data.type === "disambiguation" || data.type === "no-extract") {
        return null;
      }

      return {
        title: data.title,
        extract: data.extract,
        thumbnail: data.thumbnail,
        pageurl: data.content_urls?.desktop?.page,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      return null;
    }
  }

  private async fetchDictionary(
    text: string,
    signal: AbortSignal
  ): Promise<DictionaryDefinition | null> {
    try {
      // Only fetch dictionary for single words
      if (text.split(" ").length > 2) {
        return null;
      }

      const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
        text.toLowerCase()
      )}`;

      const response = await fetch(url, { signal });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        return null;
      }

      return {
        word: data[0].word,
        phonetic: data[0].phonetic || data[0].phonetics?.[0]?.text,
        meanings: data[0].meanings,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      return null;
    }
  }

  private showLoadingPopup(e: MouseEvent | KeyboardEvent) {
    this.hidePopup();

    const popup = document.createElement("div");
    popup.className = "melange-dictionary-popup loading";
    popup.innerHTML = `
      <div class="melange-popup-content">
        <div class="melange-popup-loading">Loading...</div>
      </div>
    `;

    document.body.appendChild(popup);
    this.popup = popup;

    // Position the popup
    this.positionPopup(e);
  }

  private getContext(selection: Selection | null): string {
    if (!selection || selection.rangeCount === 0) return "";

    try {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;

      // Get the parent element text
      const parentElement =
        container.nodeType === Node.TEXT_NODE
          ? container.parentElement
          : (container as Element);

      if (!parentElement) return "";

      // Get surrounding sentence/paragraph (up to 200 chars on each side)
      const fullText = parentElement.textContent || "";
      const selectedText = selection.toString();
      const selectedIndex = fullText.indexOf(selectedText);

      if (selectedIndex === -1) return "";

      // Extract context around the selection
      const start = Math.max(0, selectedIndex - 200);
      const end = Math.min(
        fullText.length,
        selectedIndex + selectedText.length + 200
      );
      let context = fullText.substring(start, end).trim();

      // Try to break at sentence boundaries
      if (start > 0) {
        const sentenceStart = context.search(/[.!?]\s+/);
        if (sentenceStart > 0 && sentenceStart < 100) {
          context = context.substring(sentenceStart + 2);
        }
      }

      if (end < fullText.length) {
        const sentenceEnd = context.search(/[.!?](?=\s|$)/);
        if (sentenceEnd > context.length - 100 && sentenceEnd > 0) {
          context = context.substring(0, sentenceEnd + 1);
        }
      }

      return context;
    } catch (error) {
      return "";
    }
  }

  private showPopup(
    wikiData: WikipediaExtract | null,
    dictData: DictionaryDefinition | null,
    context: string,
    e: MouseEvent | KeyboardEvent
  ) {
    // If no data from either source, don't show popup
    if (!wikiData && !dictData) {
      this.hidePopup();
      return;
    }

    this.hidePopup();

    const popup = document.createElement("div");
    popup.className = "melange-dictionary-popup";

    // Build the content
    let content = '<div class="melange-popup-inner">';

    // Main content area (left side)
    content += '<div class="melange-popup-main">';

    // Title
    const title = wikiData?.title || dictData?.word || this.selectedText;
    content += `<h3 class="melange-popup-title">${this.escapeHtml(title)}`;

    // Add phonetic if available
    if (dictData?.phonetic) {
      content += ` <span class="melange-popup-phonetic">${this.escapeHtml(
        dictData.phonetic
      )}</span>`;
    }

    content += "</h3>";

    // Show context if available
    if (context && context.length > this.selectedText.length + 20) {
      const contextWithHighlight = context.replace(
        new RegExp(`\\b(${this.escapeRegex(this.selectedText)})\\b`, "gi"),
        "<strong>$1</strong>"
      );
      content += `
        <div class="melange-popup-context">
          <em>"${contextWithHighlight}"</em>
        </div>
      `;
    }

    // Dictionary definitions (show multiple for context)
    if (dictData?.meanings && dictData.meanings.length > 0) {
      // Show up to 3 definitions from different parts of speech if available
      const meaningsToShow = dictData.meanings.slice(0, 3);

      for (const meaning of meaningsToShow) {
        const definitionsToShow = meaning.definitions.slice(0, 2); // Max 2 definitions per part of speech

        content += `
          <div class="melange-popup-dict">
            <span class="melange-popup-pos">${this.escapeHtml(
              meaning.partOfSpeech
            )}</span>
        `;

        for (let i = 0; i < definitionsToShow.length; i++) {
          const def = definitionsToShow[i];
          const defNumber = definitionsToShow.length > 1 ? `${i + 1}. ` : "";

          content += `
            <p class="melange-popup-definition">${defNumber}${this.escapeHtml(
            def.definition
          )}</p>
          `;

          // Show example if available
          if (def.example) {
            content += `
              <p class="melange-popup-example"><em>e.g., "${this.escapeHtml(
                def.example
              )}"</em></p>
            `;
          }
        }

        content += `</div>`;
      }
    }

    // Wikipedia extract
    if (wikiData?.extract) {
      content += `<p class="melange-popup-extract">${this.escapeHtml(
        wikiData.extract
      )}</p>`;
    }

    // Link to full article
    if (wikiData?.pageurl) {
      content += `
        <a href="${wikiData.pageurl}" target="_blank" class="melange-popup-link">
          Read more on Wikipedia →
        </a>
      `;
    }

    content += "</div>"; // Close main

    // Thumbnail (right side)
    if (wikiData?.thumbnail) {
      content += `
        <div class="melange-popup-thumbnail">
          <img src="${wikiData.thumbnail.source}" alt="${this.escapeHtml(
        title
      )}" />
        </div>
      `;
    }

    content += "</div>"; // Close inner

    popup.innerHTML = content;
    document.body.appendChild(popup);
    this.popup = popup;

    // Position the popup
    this.positionPopup(e);

    // Fade in animation
    requestAnimationFrame(() => {
      popup.classList.add("show");
    });
  }

  private positionPopup(e: MouseEvent | KeyboardEvent) {
    if (!this.popup) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const popup = this.popup;
    const popupRect = popup.getBoundingClientRect();

    // Calculate position (below selection by default)
    let top = rect.bottom + window.scrollY + 8;
    let left =
      rect.left + window.scrollX + rect.width / 2 - popupRect.width / 2;

    // Keep popup within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position
    if (left < 10) {
      left = 10;
    } else if (left + popupRect.width > viewportWidth - 10) {
      left = viewportWidth - popupRect.width - 10;
    }

    // If popup goes below viewport, show it above the selection
    if (rect.bottom + popupRect.height + 8 > viewportHeight) {
      top = rect.top + window.scrollY - popupRect.height - 8;
    }

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
  }

  private handleClickOutside(e: MouseEvent) {
    if (this.popup && !this.popup.contains(e.target as Node)) {
      // Check if click is inside the current selection
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          return; // Click is inside selection, don't hide
        }
      }

      this.hidePopup();
    }
  }

  private hidePopup() {
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

// Initialize the dictionary popup
new DictionaryPopup();
