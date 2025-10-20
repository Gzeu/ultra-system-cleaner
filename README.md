# 🔥 Ultra System Cleaner v1.3.0

> **Enterprise-grade cross-platform system cleanup tool** with beautiful CLI interface, comprehensive security features, advanced analytics, and flexible configuration system

[![npm version](https://img.shields.io/npm/v/@gzeu/ultra-system-cleaner.svg?style=flat-square)](https://www.npmjs.com/package/@gzeu/ultra-system-cleaner)
[![Downloads](https://img.shields.io/npm/dm/@gzeu/ultra-system-cleaner.svg?style=flat-square)](https://www.npmjs.com/package/@gzeu/ultra-system-cleaner)
[![License](https://img.shields.io/npm/l/@gzeu/ultra-system-cleaner.svg?style=flat-square)](https://github.com/Gzeu/ultra-system-cleaner/blob/main/LICENSE)
[![Node.js Version](https://img.shields.io/node/v/@gzeu/ultra-system-cleaner.svg?style=flat-square)](https://nodejs.org)

## ✨ Features

- 🚀 **Ultra-fast cleanup** - Optimized for maximum performance
- 🌍 **Cross-platform** - Works on Windows, macOS, and Linux  
- 🎨 **Beautiful CLI** - Interactive interface with colors, animations and ASCII art
- 🔒 **Enterprise security** - Backup, logging, recovery, and validation systems
- 📊 **Advanced analytics** - Comprehensive tracking and reporting capabilities
- ⚙️ **Flexible configuration** - Custom paths, exclude patterns, and settings
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
# Enterprise security with backup and logging
ultra-clean --deep --verbose-logging

# Analytics and reporting
ultra-clean --generate-report analytics.html --export-format html --dry-run

# Custom configuration
ultra-clean --config ~/enterprise-config.json --quick

# Security-focused cleanup
ultra-clean --no-backup --dry-run --verbose-logging

# Analytics for specific time period
ultra-clean --report-period 7 --dry-run
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
| `-c, --config <path>` | 📋 Use custom configuration file |
| `--save-config <path>` | 💾 Save current settings to config file |
| `--no-backup` | 🚫 Disable backup creation (less safe) |
| `--no-logging` | 🔇 Disable operation logging |
| `--verbose-logging` | 📝 Enable detailed security logging |
| `--no-analytics` | 📊 Disable analytics tracking |
| `--generate-report <path>` | 📋 Generate analytics report to file |
| `--export-format <format>` | 📄 Report format (json/csv/html) |
| `--report-period <days>` | 📅 Report period (7/30/all) |
| `--help` | 📚 Show help information |
| `--version` | 📝 Show version number |

## 🛡️ Enterprise Security Features

- **🛡️ Automatic Backup System**: Creates backups before all critical operations
- **📋 Comprehensive Logging**: 4-level logging (ERROR, WARN, INFO, SUCCESS) for audit trails
- **🔄 Recovery Mechanisms**: Restore accidentally deleted files with rollback capabilities
- **🔐 Security Validation**: Pre-operation validation for paths and permissions
- **📊 Operation Tracking**: Real-time monitoring of all cleanup activities
- **🚫 Dry Run Mode**: Preview what will be cleaned before deletion
- **🎯 Smart Detection**: Only cleans known safe temporary and cache directories
- **🌐 Cross-Platform Security**: Respects OS-specific file system permissions
- **⚠️ Error Handling**: Graceful handling of permission errors and locked files
- **✅ Confirmation Prompts**: Interactive confirmations for destructive operations
- **🎛️ Selective Cleaning**: Choose specific areas to clean with exclude patterns

## 📊 Advanced Analytics & Reporting

- **📈 Operation Tracking**: Real-time monitoring of all cleanup activities with detailed metrics
- **📋 Multi-Format Reports**: Generate reports in JSON, CSV, and HTML formats for analysis
- **📊 Trend Analysis**: Track cleanup patterns and predict future space recovery needs
- **⏱️ Performance Monitoring**: Monitor operation duration, file counts, and processing speed
- **🎯 Category Analysis**: Detailed breakdown of cleanup by file type and location
- **📅 Historical Data**: Persistent storage of cleanup history for trend analysis
- **📄 Export Capabilities**: Export analytics data for external analysis and reporting
- **🎨 Visual Reports**: HTML reports with tables, statistics, and visual elements
- **📊 Executive Dashboards**: Professional reports suitable for management review
- **🔍 Audit Trails**: Complete operation history for compliance and troubleshooting

## ⚙️ Flexible Configuration System

- **📋 Custom Configuration Files**: Define your own cleanup paths and patterns
- **🚫 Global Exclude Patterns**: System-wide patterns for files to never touch
- **🎯 Category-Specific Settings**: Different rules for different types of cleanup
- **🔄 Configuration Merging**: CLI options override config file settings intelligently
- **💾 Auto-Discovery**: Automatically finds config files in standard locations
- **📝 Configuration Export**: Save your current settings for reuse
- **🏢 Enterprise Templates**: Pre-configured setups for different environments
- **🔧 Live Configuration**: Modify settings without restarting the application

## 📊 Performance & Reliability

- **Ultra-fast deletion** using optimized algorithms
- **Parallel processing** where safe and beneficial
- **Memory efficient** streaming operations for large file sets
- **Cross-platform compatibility** (Windows, macOS, Linux)
- **Minimal dependencies** for fast installation and reduced attack surface
- **Error recovery** with graceful degradation and detailed error reporting

## 🏢 Enterprise Capabilities

Ultra System Cleaner v1.3.0 is designed for enterprise environments with:

### Production-Ready Features
- **🛡️ Enterprise Security**: Backup, logging, recovery, and compliance features
- **📊 Advanced Analytics**: Comprehensive tracking and reporting for IT management
- **⚙️ Flexible Configuration**: Custom paths, exclude patterns, and team settings
- **🔄 Automated Operations**: Scheduling and batch processing capabilities
- **📋 Audit Compliance**: Detailed logs and reports for regulatory requirements

### Team Collaboration
- **Multi-user Support**: Safe for teams with individual analytics tracking
- **Configuration Sharing**: Share cleanup configurations across team members
- **Centralized Logging**: Aggregate analytics across multiple machines
- **Report Distribution**: Share cleanup reports with IT management

### DevOps Integration
- **CI/CD Ready**: Automated cleanup in deployment pipelines
- **Container Support**: Works in Docker and cloud environments
- **API-Ready Architecture**: Extensible for custom integrations
- **Monitoring Integration**: Compatible with enterprise monitoring tools

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
  <em>Enterprise System Cleanup Tool - Production Ready</em>
</div>