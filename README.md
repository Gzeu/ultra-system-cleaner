# 🔥 Ultra System Cleaner

> Cross-platform system cleanup tool with beautiful CLI interface - Node.js version of PowerShell cleanup script

[![npm version](https://img.shields.io/npm/v/@gzeu/ultra-system-cleaner.svg?style=flat-square)](https://www.npmjs.com/package/@gzeu/ultra-system-cleaner)
[![Downloads](https://img.shields.io/npm/dm/@gzeu/ultra-system-cleaner.svg?style=flat-square)](https://www.npmjs.com/package/@gzeu/ultra-system-cleaner)
[![License](https://img.shields.io/npm/l/@gzeu/ultra-system-cleaner.svg?style=flat-square)](https://github.com/Gzeu/ultra-system-cleaner/blob/main/LICENSE)
[![Node.js Version](https://img.shields.io/node/v/@gzeu/ultra-system-cleaner.svg?style=flat-square)](https://nodejs.org)

## ✨ Features

- 🚀 **Ultra-fast cleanup** - Optimized for maximum performance
- 🌍 **Cross-platform** - Works on Windows, macOS, and Linux  
- 🎨 **Beautiful CLI** - Interactive interface with colors, animations and ASCII art
- 🔒 **Safe operations** - Built-in safety checks and dry-run mode
- 📦 **NPM integration** - Cleans NPM, Yarn, and PNPM caches
- 🌐 **Browser cleanup** - Supports Chrome, Firefox, Edge, Safari
- 🎯 **Customizable** - Choose specific areas to clean
- 🧪 **Preview mode** - See what will be cleaned before deletion
- 📊 **Detailed stats** - Shows cleaned files, size, and performance metrics

## 🚀 Quick Start

### Install globally
```bash
npm install -g @gzeu/ultra-system-cleaner
```

### Or run with npx (no installation needed)
```bash
npx @gzeu/ultra-system-cleaner
```

### Or use yarn
```bash
yarn global add @gzeu/ultra-system-cleaner
```

## 📝 Usage

### Interactive Mode (Recommended)
```bash
ultra-clean
# or
system-clean
```

### Quick Commands
```bash
ultra-clean --quick      # Quick cleanup (recommended)
ultra-clean --deep       # Thorough cleanup
ultra-clean --dry-run    # Preview what will be cleaned
ultra-clean --help       # Show all options
```

### Advanced Usage
```bash
ultra-clean --quick --yes           # Quick cleanup, skip confirmations
ultra-clean --deep --verbose        # Deep cleanup with detailed output
ultra-clean --dry-run --no-color    # Preview without colors
```

## 🎯 What Gets Cleaned

### 💻 System Files
- Temporary files
- System cache
- Crash dumps
- Windows Update cache (Windows)
- Prefetch files (Windows)

### 👤 User Data
- User temp directories
- Application caches
- Log files
- Recent documents cache

### 🌐 Browser Caches
- **Chrome**: Cache, Code Cache, GPU Cache
- **Firefox**: Profiles and cache
- **Edge**: Cache and temporary files
- **Safari**: WebKit cache (macOS)

### 📦 Development Tools
- NPM cache (`~/.npm`)
- Yarn cache (`~/.yarn/cache`)
- PNPM store (`~/.pnpm-store`)
- Node.js temporary files

### 📱 Applications
- Microsoft Teams cache
- Slack cache
- Zoom logs
- Adobe cache
- And many more...

## 🔧 CLI Options

| Option | Description |
|--------|-------------|
| `-q, --quick` | ⚡ Quick cleanup mode (recommended) |
| `-d, --deep` | 🔥 Deep cleanup mode (thorough) |
| `-i, --interactive` | 🎯 Interactive mode (default) |
| `--dry-run` | 🧪 Preview mode - don't delete anything |
| `-v, --verbose` | 📝 Verbose output with detailed logs |
| `-y, --yes` | ✅ Skip all confirmations |
| `--no-color` | 🎨 Disable colors and formatting |
| `--help` | 📚 Show help information |
| `--version` | 📝 Show version number |

## 🛡️ Safety Features

- **Dry Run Mode**: Preview what will be cleaned before deletion
- **Smart Detection**: Only cleans known safe temporary and cache directories
- **Cross-Platform**: Respects OS-specific file system permissions
- **Error Handling**: Graceful handling of permission errors
- **Confirmation Prompts**: Interactive confirmations for destructive operations
- **Selective Cleaning**: Choose specific areas to clean

## 📊 Performance

- **Ultra-fast deletion** using optimized algorithms
- **Parallel processing** where safe
- **Memory efficient** streaming operations
- **Cross-platform compatibility** (Windows, macOS, Linux)
- **Minimal dependencies** for fast installation

## 🔄 Supported Platforms

- 🏢 **Windows** 10/11 (PowerShell equivalent functionality)
- 🍎 **macOS** 10.14+ (Intel & Apple Silicon)
- 🐧 **Linux** (Ubuntu, Debian, CentOS, Arch, etc.)
- 🐳 **Docker** containers
- ☁️ **Cloud environments** (GitHub Actions, etc.)

## 🕰 Requirements

- **Node.js** 14.0.0 or higher
- **NPM** 6.0.0 or higher
- **Administrator/sudo** privileges recommended for best results

## 🐛 Issues & Contributing

Found a bug or want to contribute? 

- 🐛 **Report issues**: [GitHub Issues](https://github.com/Gzeu/ultra-system-cleaner/issues)
- 📝 **Contributions**: [Pull Requests Welcome](https://github.com/Gzeu/ultra-system-cleaner/pulls)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Gzeu/ultra-system-cleaner/discussions)

## 📝 License

MIT © [George Pricop](https://github.com/Gzeu)

## 📞 Support

If you find this tool helpful:

- ⭐ **Star** the repository
- 🐦 **Follow** [@Gzeu](https://github.com/Gzeu) on GitHub
- 💬 **Share** with friends and colleagues
- ☕ **Support**: [Buy me a coffee](https://github.com/sponsors/Gzeu)

---

<div align="center">
  <strong>🚀 Made with ❤️  by <a href="https://github.com/Gzeu">George Pricop</a></strong><br>
  <em>Blockchain Developer & AI Automation Specialist</em>
</div>