# Melange Ext

## ✨ Features

- 📖 **Dictionary Definitions** - Get instant word definitions from the Free Dictionary API
- 🌐 **Wikipedia Integration** - See Wikipedia summaries with images for concepts, people, and places

## 🚀 Installation

### From Release (Recommended)
1. Download the latest release ZIP from the [Releases page](../../releases)
2. Unzip the file
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer mode** (toggle in top right)
5. Click **Load unpacked**
6. Select the `dist` folder from the unzipped files

### From Source
```bash
# Clone the repository
git clone https://github.com/yourusername/melange.git
cd melange

# Install dependencies
bun install

# Build the extension
bun run build

# Load the dist/ folder in Chrome as an unpacked extension
```

## 📖 Usage

1. **Highlight any word** on any webpage
2. **Popup appears instantly** with:
   - Dictionary definition (part of speech, meaning)
   - Wikipedia summary
   - Related image (if available)
   - Link to full Wikipedia article
3. **Close with ESC** or click outside the popup

### Project Structure
```
melange/
├── src/
│   ├── content/
│   │   ├── dictionary.ts      # Main dictionary popup logic
│   │   ├── chess_com.tsx       # Chess.com specific script
│   │   └── fb.ts               # Facebook specific script
│   ├── styles/
│   │   └── dictionary.css      # Wikipedia-style popup CSS
│   ├── popup/
│   │   └── index.tsx           # Extension popup UI
│   └── components/
│       └── App.tsx             # React components
├── public/
│   ├── manifest.json           # Extension manifest
│   └── logo.png                # Extension icon
└── dist/                       # Built extension (generated)
```
