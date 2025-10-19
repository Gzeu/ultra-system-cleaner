const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const chalk = require('chalk');

class ConfigManager {
    constructor() {
        this.config = null;
        this.configPath = null;
        this.defaultConfigPath = path.join(__dirname, '..', 'config', 'default-config.json');
    }

    // 🎨 Load configuration file
    async loadConfig(configPath = null) {
        try {
            // Determine config file path
            if (configPath) {
                this.configPath = path.resolve(configPath);
            } else {
                // Check for config file in current directory
                const localConfigPath = path.join(process.cwd(), 'ultra-cleaner.json');
                const homeConfigPath = path.join(os.homedir(), '.ultra-cleaner.json');

                if (await this.fileExists(localConfigPath)) {
                    this.configPath = localConfigPath;
                } else if (await this.fileExists(homeConfigPath)) {
                    this.configPath = homeConfigPath;
                } else {
                    this.configPath = this.defaultConfigPath;
                }
            }

            // Read and parse config file
            const configContent = await fs.readFile(this.configPath, 'utf8');
            this.config = JSON.parse(configContent);

            // Validate configuration
            await this.validateConfig();

            console.log(chalk.cyan(`📋 Loaded configuration: ${path.basename(this.configPath)}`));

            return this.config;

        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(chalk.yellow(`⚠️  Configuration file not found, using defaults`));
                return this.loadDefaultConfig();
            } else {
                throw new Error(`Failed to load configuration: ${error.message}`);
            }
        }
    }

    // 📄 Load default configuration
    async loadDefaultConfig() {
        try {
            const defaultContent = await fs.readFile(this.defaultConfigPath, 'utf8');
            this.config = JSON.parse(defaultContent);
            this.configPath = this.defaultConfigPath;
            return this.config;
        } catch (error) {
            throw new Error(`Failed to load default configuration: ${error.message}`);
        }
    }

    // ✅ Validate configuration structure
    async validateConfig() {
        if (!this.config || typeof this.config !== 'object') {
            throw new Error('Configuration must be a valid JSON object');
        }

        // Check required fields
        const required = ['version', 'global', 'categories'];
        for (const field of required) {
            if (!(field in this.config)) {
                throw new Error(`Missing required configuration field: ${field}`);
            }
        }

        // Validate global settings
        if (this.config.global) {
            const validLogLevels = ['error', 'warn', 'info', 'debug'];
            if (this.config.global.logLevel && !validLogLevels.includes(this.config.global.logLevel)) {
                throw new Error(`Invalid log level: ${this.config.global.logLevel}`);
            }
        }

        // Validate categories
        if (this.config.categories) {
            const validCategories = ['system', 'user', 'browsers', 'apps', 'npm', 'logs'];
            for (const category of Object.keys(this.config.categories)) {
                if (!validCategories.includes(category)) {
                    console.warn(chalk.yellow(`⚠️  Unknown category: ${category}`));
                }
            }
        }

        return true;
    }

    // 🔧 Merge command line options with config file
    mergeOptions(cliOptions) {
        if (!this.config) return cliOptions;

        const merged = { ...cliOptions };

        // Merge global settings
        if (this.config.global) {
            merged.dryRun = cliOptions.dryRun !== undefined ? cliOptions.dryRun : this.config.global.dryRun;
            merged.verbose = cliOptions.verbose !== undefined ? cliOptions.verbose : this.config.global.verbose;
            merged.parallel = cliOptions.parallel !== undefined ? cliOptions.parallel : this.config.global.parallel;
            merged.backup = cliOptions.backup !== undefined ? cliOptions.backup : this.config.global.backup;
        }

        // Merge custom paths
        if (this.config.customPaths) {
            merged.customPaths = this.config.customPaths.filter(cp => cp.enabled !== false);
        }

        // Merge exclude patterns
        if (this.config.excludePatterns) {
            merged.excludePatterns = {
                global: [...(cliOptions.excludePatterns?.global || []), ...this.config.excludePatterns.global],
                perCategory: { ...this.config.excludePatterns.perCategory }
            };
        }

        return merged;
    }

    // 📂 Get custom paths for a specific category
    getCustomPathsForCategory(category) {
        if (!this.config?.customPaths) return [];

        return this.config.customPaths
            .filter(cp => cp.enabled && cp.category === category)
            .flatMap(cp => cp.paths);
    }

    // 🚫 Check if path should be excluded
    shouldExcludePath(filePath, category = null) {
        if (!this.config?.excludePatterns) return false;

        const patterns = [];

        // Add global patterns
        if (this.config.excludePatterns.global) {
            patterns.push(...this.config.excludePatterns.global);
        }

        // Add category-specific patterns
        if (category && this.config.excludePatterns.perCategory?.[category]) {
            patterns.push(...this.config.excludePatterns.perCategory[category]);
        }

        // Check each pattern
        for (const pattern of patterns) {
            if (this.matchesPattern(filePath, pattern)) {
                return true;
            }
        }

        return false;
    }

    // 🎯 Pattern matching utility
    matchesPattern(filePath, pattern) {
        // Handle different pattern formats
        let regexPattern = pattern;

        // Escape special regex characters except our wildcards and character classes
        regexPattern = regexPattern.replace(/[.+^${}()|\\]/g, '\\$&');

        // Convert glob patterns to regex
        regexPattern = regexPattern
            .replace(/\*\*/g, '.*')  // ** matches any characters including slashes
            .replace(/\*/g, '[^/]*') // * matches any characters except slashes
            .replace(/\?/g, '[^/]'); // ? matches single character except slash

        try {
            const regex = new RegExp(regexPattern, 'i');
            return regex.test(filePath);
        } catch (error) {
            console.warn(`⚠️ Invalid pattern: ${pattern} - ${error.message}`);
            return false;
        }
    }

    // 💾 Save current configuration
    async saveConfig(targetPath = null) {
        const savePath = targetPath || this.configPath;

        try {
            await fs.writeFile(savePath, JSON.stringify(this.config, null, 2), 'utf8');
            console.log(chalk.green(`✅ Configuration saved to: ${savePath}`));
            return true;
        } catch (error) {
            throw new Error(`Failed to save configuration: ${error.message}`);
        }
    }

    // 🛠️ Helper function to check if file exists
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = ConfigManager;
