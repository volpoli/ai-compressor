# 🪨 AI Compressor (Caveman Mode)

A zero-dependency CLI tool engineered to drastically compress text and code before sending it to LLMs (like Gemini, Claude, or ChatGPT) via context windows. 

It uses a **Graceful Degradation** architecture: it attempts to intelligently compress text using a free AI endpoint first, and automatically falls back to a deterministic, regex-based local engine if you are offline or hit rate limits.

**Save tokens. Keep the code safe. Drop the filler.**

## 🌐 Environment & Compatibility
Optimized for WSL2 (Ubuntu) on Windows 10/11. Native support for UTF-8 to UTF-16LE clipboard bridging.

## 🚀 Features

* **Zero Dependencies:** Built entirely with native Node.js (v18+) modules. No heavy `node_modules` folder, instant startup time.
* **Configuration Files:** Automatic discovery of `.aicompress.json` or `.aicompress.yaml` files for project-specific settings.
* **Batch Processing:** Process entire directories recursively with intelligent file filtering and progress tracking.
* **Language-Specific Engines:** Specialized compression for JavaScript/TypeScript, Python, CSS, HTML, JSON, and more.
* **Multiple Output Formats:** Choose between default, JSON, or stats-only output formats.
* **Compression Statistics:** Detailed metrics showing size reduction, lines removed, and bytes saved.
* **Placeholder Pattern:** Completely immune to code corruption. Code blocks (\`\`\`), HTML tags, and Markdown links are securely locked away before text destruction begins, guaranteeing absolute syntax safety.
* **Intelligent Gatekeeper:** Automatically detects if a file is prose (Markdown/Text) or source code (TS, JS, Python, etc.), applying the correct minification strategy.
* **Native Clipboard Support:** Cross-platform output copying, seamlessly supporting Windows, macOS, Linux, and **WSL2**.

## 📦 Installation

Since it's zero-dependency, you can clone and build it in seconds:

```bash
git clone https://github.com/YOUR_USERNAME/ai-compressor.git
cd ai-compressor
yarn install
yarn build
```

To make it globally available on your system (Unix/Linux/WSL2):
```bash
chmod +x dist/cli.js
sudo ln -s "$PWD/dist/cli.js" /usr/local/bin/ai-compress
```

## 🛠️ Usage

```bash
ai-compress <file|directory> [options]
```

### Options
* `-f, --file` : Path to the file or directory you want to compress.
* `-m, --mode` : Force compression mode (`text` or `code`). Default is `auto`.
* `-o, --output` : Output destination (`clip` or `file`). Default is `clip` (copies to clipboard). NOTE: cannot use 'clip' with --recursive
* `--format` : Output format (`default`, `json`, or `stats-only`). Default is `default`.
* `-v, --verbose` : Show detailed processing information.
* `-q, --quiet` : Minimal output (only errors and final results).
* `--dry-run` : Preview compression without saving/copying output.
* `-r, --recursive` : Process directories recursively (batch processing).
* `-h, --help` : Show help information.
* `--format` : Output format (`default`, `json`, or `stats-only`). Default is `default`.
* `-v, --verbose` : Show detailed processing information.
* `-q, --quiet` : Minimal output (only errors and final results).
* `--dry-run` : Preview compression without saving/copying output.
* `-r, --recursive` : Process directories recursively (batch processing).
* `-h, --help` : Show help information.

### Examples

**1. Compress project documentation and copy to clipboard:**
```bash
ai-compress docs/architecture.md
```

**2. Compress a source file safely (strips comments, minifies safely):**
```bash
ai-compress src/lib/micro-bus.ts
```

**3. Save the compressed output to a new file instead of clipboard:**
```bash
ai-compress README.md -o file
```

**4. Process an entire directory recursively with verbose output:**
```bash
ai-compress src/ --recursive --verbose
```

**5. Get JSON output for automation/scripting:**
```bash
ai-compress script.js --format json
```

**6. Show only compression statistics:**
```bash
ai-compress document.md --format stats-only
```

**7. Preview compression without making changes:**
```bash
ai-compress file.py --dry-run --verbose
```

## ⚙️ Configuration

The tool automatically searches for configuration files starting from the current directory up to the project root:

* `.aicompress.json`
* `.aicompress.yaml`
* `.aicompress.yml`

### Configuration Options

```json
{
  "mode": "auto",
  "output": "clip",
  "format": "default",
  "verbose": false,
  "quiet": false,
  "dryRun": false,
  "recursive": false,
  "maxFileSize": 1048576,
  "exclude": ["node_modules", ".git", "dist", "build"],
  "include": [],
  "preserve": {
    "docs": false,
    "comments": false,
    "emptyLines": false
  }
}
```

CLI options override configuration file settings. Use `--help` to see all available options.

This tool is designed to work in two tiers:

1.  **Tier 1 (AI Semantic Compression):** If you provide a free Gemini API key, the tool leverages `fetch` (native Node.js) to semantically compress your text into "Caveman" style without losing technical meaning.
2.  **Tier 2 (Deterministic Local Fallback):** If you are offline, or if the API hits a 429 Rate Limit, the tool instantly falls back to a local Regex engine that strips common stopwords and whitespace, protecting your code via the *Placeholder Pattern*.

**Language-Specific Engines:** For code compression, the tool uses specialized engines for different programming languages:
- **JavaScript/TypeScript:** Safe comment removal and whitespace optimization
- **Python:** Indentation preservation with comment stripping
- **CSS:** Brace formatting and comment removal
- **HTML:** Tag optimization and whitespace reduction
- **JSON:** Structure preservation with formatting cleanup

**To activate Tier 1:**
Export your free Gemini API key in your terminal profile (e.g., `~/.bashrc` or `~/.zshrc`):
```bash
export GEMINI_FREE_KEY="your_api_key_here"
```

## 🛡️ Safety First
The internal `detect.ts` gatekeeper prevents accidental destruction of source code. If you try to force the `text` engine onto a file like `.env` or `app.tsx`, the tool will abort the operation to preserve your syntax.

---
*Built with logic, precision, and the Pro & Deluxe mindset.*
