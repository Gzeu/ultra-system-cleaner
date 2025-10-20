const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const ora = require('ora');
const bytes = require('bytes');
const { rimraf } = require('rimraf');
const boxen = require('boxen');
const gradient = require('gradient-string');
const SecurityManager = require('./security-manager');
const AnalyticsManager = require('./analytics-manager');

class UltraSystemCleaner {
    constructor(options = {}) {
        this.options = {
            dryRun: false,
            verbose: false,
            mode: 'interactive',
            customAreas: null,
            skipConfirmation: false,
            enableBackup: true,
            enableLogging: true,
            enableAnalytics: true,
            generateReport: null,
            exportFormat: 'json',
            ...options
        };

        // Initialize security manager
        this.securityManager = new SecurityManager({
            enableBackup: this.options.enableBackup,
            enableLogging: this.options.enableLogging,
            verbose: this.options.verbose
        });

        // Initialize analytics manager
        this.analyticsManager = new AnalyticsManager({
            enableAnalytics: this.options.enableAnalytics,
            verbose: this.options.verbose
        });
        
        this.stats = {
            totalCleaned: 0,
            totalFiles: 0,
            areasProcessed: 0,
            startTime: Date.now()
        };
    }

    // 🎨 Beautiful progress display
    createSpinner(text, emoji = '🚀') {
        return ora({
            text: `${emoji} ${text}`,
            spinner: 'dots12',
            color: 'cyan'
        });
    }

    // 📁 Calculate folder size with progress
    async getFolderSize(folderPath, showProgress = true) {
        const spinner = showProgress ? this.createSpinner(`Calculating size: ${path.basename(folderPath)}`, '📁') : null;
        
        try {
            if (spinner) spinner.start();
            
            let totalSize = 0;
            let fileCount = 0;
            
            const calculateRecursive = async (currentPath) => {
                try {
                    const items = await fs.readdir(currentPath, { withFileTypes: true });
                    
                    for (const item of items) {
                        const fullPath = path.join(currentPath, item.name);
                        
                        if (item.isDirectory()) {
                            const subResult = await calculateRecursive(fullPath);
                            totalSize += subResult.size;
                            fileCount += subResult.count;
                        } else {
                            try {
                                const stat = await fs.stat(fullPath);
                                totalSize += stat.size;
                                fileCount++;
                            } catch (err) {
                                // Skip permission errors
                            }
                        }
                    }
                } catch (err) {
                    // Skip permission errors
                }
                
                return { size: totalSize, count: fileCount };
            };
            
            const result = await calculateRecursive(folderPath);
            
            if (spinner) {
                spinner.succeed(chalk.green(`📁 ${path.basename(folderPath)}: ${result.count} files, ${bytes(result.size)}`));
            }
            
            return result;
            
        } catch (error) {
            if (spinner) {
                spinner.fail(chalk.yellow(`⚠️  Could not calculate: ${path.basename(folderPath)}`));
            }
            return { size: 0, count: 0 };
        }
    }

    // 🗑️ Clean path with beautiful progress
    async cleanPath(targetPath, description, category = 'general') {
        const emoji = this.getCategoryEmoji(category);
        const spinner = this.createSpinner(description, emoji);

        try {
            // Security validation
            const isValid = await this.securityManager.validateOperation(targetPath, 'delete');
            if (!isValid) {
                spinner.fail(chalk.red(`🚫 Security validation failed: ${description}`));
                return { size: 0, count: 0 };
            }

            const exists = await fs.access(targetPath).then(() => true).catch(() => false);

            if (!exists) {
                spinner.info(chalk.gray(`🔍 Not found: ${description}`));
                return { size: 0, count: 0 };
            }

            const { size, count } = await this.getFolderSize(targetPath, false);

            if (size === 0) {
                spinner.info(chalk.gray(`📭 Empty: ${description}`));
                return { size: 0, count: 0 };
            }

            // Create backup before deletion (if enabled and not dry run)
            let backupId = null;
            if (this.options.enableBackup && !this.options.dryRun) {
                backupId = await this.securityManager.createBackup(targetPath, 'delete');
                this.securityManager.log('INFO', `Backup created for deletion: ${description}`, {
                    backupId,
                    path: targetPath,
                    size: bytes(size)
                });
            }

            if (this.options.dryRun) {
                spinner.succeed(chalk.yellow(`🧪 [DRY RUN] ${description}: ${count} files, ${bytes(size)}`));
                // Update stats even in dry-run mode for accurate reporting
                this.stats.totalCleaned += size;
                this.stats.totalFiles += count;
                this.stats.areasProcessed++;
                return { size, count };
            }

            spinner.start();

            // Use rimraf for cross-platform deletion
            await rimraf(targetPath);

            // Recreate empty folder
            try {
                await fs.mkdir(targetPath, { recursive: true });
            } catch (err) {
                // Some paths don't need recreation
            }

            this.stats.totalCleaned += size;
            this.stats.totalFiles += count;
            this.stats.areasProcessed++;

            spinner.succeed(chalk.green(`✅ ${description}: ${count} files, ${bytes(size)} freed`));

            // Log successful operation
            this.securityManager.log('SUCCESS', `Cleanup completed: ${description}`, {
                path: targetPath,
                files: count,
                size: bytes(size),
                backupId
            });

            // Track analytics
            this.analyticsManager.trackOperation({
                type: 'cleanup',
                category: category,
                description: description,
                files: count,
                size: size,
                success: true,
                duration: Date.now() - this.stats.startTime,
                metadata: { backupId }
            });

            return { size, count };

        } catch (error) {
            spinner.fail(chalk.yellow(`⚠️  Partial cleanup: ${description} - ${error.message}`));

            // Log error with context
            this.securityManager.log('ERROR', `Cleanup failed: ${description}`, {
                path: targetPath,
                error: error.message,
                category
            });

            // Track analytics for failed operation
            this.analyticsManager.trackOperation({
                type: 'cleanup',
                category: category,
                description: description,
                files: 0,
                size: 0,
                success: false,
                duration: Date.now() - this.stats.startTime,
                error: error.message,
                metadata: { targetPath }
            });

            return { size: 0, count: 0 };
        }
    }

    // 🎨 Get emoji for category
    getCategoryEmoji(category) {
        const emojis = {
            system: '💻',
            user: '👤',
            browser: '🌐',
            app: '📱',
            npm: '📦',
            log: '📋',
            general: '🧹'
        };
        return emojis[category] || '🧽';
    }

    // 📂 Get cleanup paths based on OS
    getCleanupPaths() {
        const platform = os.platform();
        const homeDir = os.homedir();
        const tempDir = os.tmpdir();
        
        let paths = {
            system: [],
            user: [],
            browsers: [],
            apps: [],
            npm: [],
            logs: []
        };

        // Common paths
        paths.system.push({
            path: tempDir,
            description: 'System Temp Directory',
            category: 'system'
        });

        if (platform === 'win32') {
            const localAppData = process.env.LOCALAPPDATA;
            const appData = process.env.APPDATA;
            
            // Windows specific paths
            paths.user = [
                { path: process.env.TEMP, description: 'User Temp', category: 'user' },
                { path: path.join(localAppData, 'Temp'), description: 'Local AppData Temp', category: 'user' },
                { path: path.join(localAppData, 'Microsoft', 'Windows', 'INetCache'), description: 'Internet Cache', category: 'user' },
                { path: path.join(localAppData, 'Microsoft', 'Windows', 'WebCache'), description: 'Web Cache', category: 'user' },
                { path: path.join(localAppData, 'CrashDumps'), description: 'Crash Dumps', category: 'user' }
            ];
            
            paths.browsers = [
                { path: path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Cache'), description: 'Chrome Cache', category: 'browser' },
                { path: path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Code Cache'), description: 'Chrome Code Cache', category: 'browser' },
                { path: path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'GPUCache'), description: 'Chrome GPU Cache', category: 'browser' },
                { path: path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Service Worker', 'CacheStorage'), description: 'Chrome Service Worker Cache', category: 'browser' },
                { path: path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache'), description: 'Edge Cache', category: 'browser' },
                { path: path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Code Cache'), description: 'Edge Code Cache', category: 'browser' },
                { path: path.join(localAppData, 'Mozilla', 'Firefox', 'Profiles'), description: 'Firefox Cache', category: 'browser' },
                { path: path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data', 'Default', 'Cache'), description: 'Brave Cache', category: 'browser' },
                { path: path.join(localAppData, 'Opera Software', 'Opera Stable', 'Cache'), description: 'Opera Cache', category: 'browser' }
            ];
            
            paths.apps = [
                { path: path.join(appData, 'Microsoft', 'Teams', 'Cache'), description: 'Teams Cache', category: 'app' },
                { path: path.join(appData, 'Slack', 'Cache'), description: 'Slack Cache', category: 'app' },
                { path: path.join(appData, 'Zoom', 'logs'), description: 'Zoom Logs', category: 'log' },
                { path: path.join(localAppData, 'Discord'), description: 'Discord Cache', category: 'app' },
                { path: path.join(appData, 'Code', 'Cache'), description: 'VS Code Cache', category: 'app' },
                { path: path.join(appData, 'Code', 'CachedData'), description: 'VS Code Cached Data', category: 'app' },
                { path: path.join(localAppData, 'Microsoft', 'VisualStudio'), description: 'Visual Studio Cache', category: 'app' },
                { path: path.join(appData, 'Steam', 'htmlcache'), description: 'Steam HTML Cache', category: 'app' }
            ];
            
            paths.logs = [
                { path: path.join(localAppData, 'Microsoft', 'Windows', 'WER', 'ReportArchive'), description: 'Windows Error Reports', category: 'log' },
                { path: path.join(appData, 'Microsoft', 'Teams', 'logs'), description: 'Teams Logs', category: 'log' },
                { path: path.join(localAppData, 'CrashDumps'), description: 'System Crash Dumps', category: 'log' },
                { path: path.join(homeDir, 'AppData', 'LocalLow', 'Microsoft', 'CryptnetUrlCache'), description: 'Cryptnet URL Cache', category: 'log' }
            ];
            
        } else if (platform === 'darwin') {
            // macOS paths
            paths.user = [
                { path: path.join(homeDir, 'Library', 'Caches'), description: 'User Caches', category: 'user' },
                { path: path.join(homeDir, 'Library', 'Logs'), description: 'User Logs', category: 'log' }
            ];
            
            paths.browsers = [
                { path: path.join(homeDir, 'Library', 'Caches', 'Google', 'Chrome'), description: 'Chrome Cache', category: 'browser' },
                { path: path.join(homeDir, 'Library', 'Caches', 'Mozilla'), description: 'Firefox Cache', category: 'browser' }
            ];
            
        } else {
            // Linux paths
            paths.user = [
                { path: path.join(homeDir, '.cache'), description: 'User Cache', category: 'user' },
                { path: path.join(homeDir, '.local', 'share', 'Trash'), description: 'Trash', category: 'user' }
            ];
            
            paths.browsers = [
                { path: path.join(homeDir, '.cache', 'google-chrome'), description: 'Chrome Cache', category: 'browser' },
                { path: path.join(homeDir, '.cache', 'mozilla'), description: 'Firefox Cache', category: 'browser' },
                { path: path.join(homeDir, '.cache', 'chromium'), description: 'Chromium Cache', category: 'browser' }
            ];
        }

        // NPM and Node.js caches (all platforms)
        paths.npm = [
            { path: path.join(homeDir, '.npm'), description: 'NPM Cache', category: 'npm' },
            { path: path.join(homeDir, '.yarn', 'cache'), description: 'Yarn Cache', category: 'npm' },
            { path: path.join(homeDir, '.pnpm-store'), description: 'PNPM Store', category: 'npm' }
        ];

        return paths;
    }

    // 🚀 Main cleanup process
    async run() {
        console.log(gradient('#ff6b6b', '#4ecdc4')('\n🚀 Starting Ultra System Cleanup...\n'));

        // Initialize security systems
        await this.securityManager.initialize();

        // Initialize analytics system
        await this.analyticsManager.initialize();

        // Start analytics session
        this.analyticsManager.startSession();

        const paths = this.getCleanupPaths();
        const mode = this.options.mode || 'interactive';
        
        // Determine which areas to clean
        let areasToClean = ['system', 'user', 'browsers', 'apps', 'npm', 'logs'];
        
        if (mode === 'quick') {
            areasToClean = ['system', 'user', 'npm'];
        } else if (this.options.customAreas) {
            areasToClean = this.options.customAreas;
        }
        
        // Clean each area
        for (const area of areasToClean) {
            if (paths[area] && paths[area].length > 0) {
                console.log(chalk.magenta(`\n${this.getCategoryEmoji(area)} ${area.toUpperCase()} CLEANUP`));
                
                for (const pathInfo of paths[area]) {
                    await this.cleanPath(pathInfo.path, pathInfo.description, pathInfo.category);
                }
            }
        }
        
        // NPM cache clean
        await this.cleanNpmCache();
        
        // Final results
        await this.displayResults();

        // End analytics session
        this.analyticsManager.endSession();

        // Display security summary
        await this.displaySecuritySummary();

        // Display analytics summary if enabled
        await this.displayAnalyticsSummary();

        // Generate report if requested
        if (this.options.generateReport) {
            await this.generateAndExportReport();
        }
    }

    // 🔐 Display security summary
    async displaySecuritySummary() {
        const securitySummary = this.securityManager.getOperationSummary();

        if (securitySummary.totalOperations > 0) {
            const securityBox = boxen(
                `${chalk.blue.bold('🔐 SECURITY SUMMARY')}\n\n` +
                `${chalk.white('📊 Operations:')} ${chalk.cyan(securitySummary.totalOperations)}\n` +
                `${chalk.white('✅ Success:')} ${chalk.green(securitySummary.successes)}\n` +
                `${chalk.white('⚠️  Warnings:')} ${chalk.yellow(securitySummary.warnings)}\n` +
                `${chalk.white('❌ Errors:')} ${chalk.red(securitySummary.errors)}\n` +
                `${chalk.white('💾 Backups:')} ${chalk.cyan(securitySummary.backups)}\n\n` +
                `${chalk.gray('📋 Detailed logs saved to: ~/.ultra-cleaner.log')}\n` +
                `${chalk.gray('💾 Backups location: ~/.ultra-cleaner-backups')}`,
                {
                    padding: 1,
                    margin: 1,
                    borderStyle: 'double',
                    borderColor: 'blue',
                    backgroundColor: '#1a1a2e'
                }
            );

            console.log('\n' + securityBox);
        }

        // Save final security report
        await this.securityManager.saveSecurityReport();
    }

    // 📊 Display analytics summary
    async displayAnalyticsSummary() {
        if (!this.options.enableAnalytics) {
            return;
        }

        try {
            const analyticsSummary = this.analyticsManager.analyticsData.summary;

            if (analyticsSummary.totalSessions > 0) {
                const analyticsBox = boxen(
                    `${chalk.magenta.bold('📊 ANALYTICS SUMMARY')}\n\n` +
                    `${chalk.white('📈 Total Sessions:')} ${chalk.cyan(analyticsSummary.totalSessions)}\n` +
                    `${chalk.white('📁 Files Cleaned:')} ${chalk.cyan(analyticsSummary.totalFilesCleaned.toLocaleString())}\n` +
                    `${chalk.white('💾 Space Recovered:')} ${chalk.cyan(this.analyticsManager.formatBytes(analyticsSummary.totalSpaceRecovered))}\n` +
                    `${chalk.white('📊 Average per Session:')} ${chalk.cyan(this.analyticsManager.formatBytes(Math.round(analyticsSummary.averageSessionSize)))}\n` +
                    `${analyticsSummary.mostActiveDay ? `${chalk.white('📅 Most Active Day:')} ${chalk.cyan(analyticsSummary.mostActiveDay)}\n` : ''}` +
                    `${chalk.gray('📋 Detailed analytics saved to: ~/.ultra-cleaner-analytics/')}`,
                    {
                        padding: 1,
                        margin: 1,
                        borderStyle: 'double',
                        borderColor: 'magenta',
                        backgroundColor: '#1a1a2e'
                    }
                );

                console.log('\n' + analyticsBox);
            }
        } catch (error) {
            console.warn(chalk.yellow(`⚠️  Failed to display analytics summary: ${error.message}`));
        }
    }

    // 📋 Generate and export report
    async generateAndExportReport() {
        try {
            const reportPath = await this.analyticsManager.exportAnalytics(
                this.options.generateReport,
                this.options.exportFormat
            );

            if (reportPath) {
                console.log(chalk.green(`\n📊 Analytics report exported: ${reportPath}`));

                // Show a preview for HTML reports
                if (this.options.exportFormat === 'html') {
                    console.log(chalk.gray(`   Open in browser to view charts and detailed analysis`));
                }
            }
        } catch (error) {
            console.error(chalk.red(`❌ Failed to generate report: ${error.message}`));
        }
    }

    // 🧽 NPM cache cleanup
    async cleanNpmCache() {
        if (this.options.dryRun) return;
        
        const spinner = this.createSpinner('Cleaning NPM cache', '📦');
        
        try {
            const { spawn } = require('child_process');
            
            await new Promise((resolve, reject) => {
                const npmClean = spawn('npm', ['cache', 'clean', '--force'], {
                    stdio: 'pipe'
                });
                
                npmClean.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`NPM clean exited with code ${code}`));
                });
                
                npmClean.on('error', reject);
            });
            
            spinner.succeed(chalk.green('✅ NPM cache cleaned'));
        } catch (error) {
            spinner.fail(chalk.yellow(`⚠️  NPM cache cleanup failed: ${error.message}`));
        }
    }

    // 🎊 Display beautiful results
    async displayResults() {
        const duration = ((Date.now() - this.stats.startTime) / 1000).toFixed(1);
        const speedMBps = this.stats.totalCleaned > 0 ? 
            ((this.stats.totalCleaned / (1024 * 1024)) / parseFloat(duration)).toFixed(1) : 0;
        
        const resultBox = boxen(
            `${chalk.green.bold('🎉 CLEANUP COMPLETED SUCCESSFULLY! 🎉')}\n\n` +
            `${chalk.white('⏱️  Duration:')} ${chalk.cyan(duration + ' seconds')}\n` +
            `${chalk.white('📁 Files processed:')} ${chalk.cyan(this.stats.totalFiles.toLocaleString())}\n` +
            `${chalk.white('💾 Data processed:')} ${chalk.cyan(bytes(this.stats.totalCleaned))}\n` +
            `${chalk.white('🎯 Areas cleaned:')} ${chalk.cyan(this.stats.areasProcessed)}\n` +
            `${chalk.white('⚡ Speed:')} ${chalk.cyan(speedMBps + ' MB/s')}\n\n` +
            `${chalk.gray('🔄 Run monthly for optimal performance!')}\n` +
            `${chalk.gray('⭐ Star us on GitHub: https://github.com/Gzeu/ultra-system-cleaner')}`,
            {
                padding: 1,
                margin: 1,
                borderStyle: 'double',
                borderColor: 'green',
                backgroundColor: '#0d4f3c'
            }
        );
        
        console.log('\n' + resultBox);
        
        // Performance message
        if (this.stats.totalCleaned > 1024 * 1024 * 1024) { // > 1GB
            console.log(gradient('#FFD700', '#FFA500')('\n🏆 EXCELLENT! Very effective cleanup!\n'));
        } else if (this.stats.totalCleaned > 100 * 1024 * 1024) { // > 100MB
            console.log(chalk.green('\n👍 Good cleanup results!\n'));
        }
    }
}

module.exports = UltraSystemCleaner;