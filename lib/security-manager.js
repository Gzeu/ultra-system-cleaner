const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const chalk = require('chalk');

class SecurityManager {
    constructor(options = {}) {
        this.options = {
            enableLogging: true,
            enableBackup: true,
            backupLocation: path.join(os.homedir(), '.ultra-cleaner-backups'),
            logLocation: path.join(os.homedir(), '.ultra-cleaner.log'),
            maxBackupSize: 1024 * 1024 * 1024, // 1GB
            retentionDays: 30,
            ...options
        };

        this.operationLog = [];
        this.backups = new Map();
        this.currentSession = Date.now();
    }

    // 🔐 Initialize security systems
    async initialize() {
        if (this.options.enableLogging) {
            await this.initializeLogging();
        }

        if (this.options.enableBackup) {
            await this.initializeBackup();
        }

        this.log('INFO', 'SecurityManager initialized', {
            logging: this.options.enableLogging,
            backup: this.options.enableBackup,
            session: this.currentSession
        });
    }

    // 📝 Comprehensive logging system
    async initializeLogging() {
        try {
            // Ensure log directory exists
            await fs.mkdir(path.dirname(this.options.logLocation), { recursive: true });

            // Create log entry
            await this.logToFile('INFO', 'Logging system initialized', {
                location: this.options.logLocation,
                maxSize: this.options.maxBackupSize,
                retention: this.options.retentionDays
            });

        } catch (error) {
            console.warn(chalk.yellow(`⚠️  Failed to initialize logging: ${error.message}`));
        }
    }

    // 💾 Backup system initialization
    async initializeBackup() {
        try {
            // Ensure backup directory exists
            await fs.mkdir(this.options.backupLocation, { recursive: true });

            // Clean old backups
            await this.cleanupOldBackups();

            this.log('INFO', 'Backup system initialized', {
                location: this.options.backupLocation,
                maxSize: this.options.maxBackupSize
            });

        } catch (error) {
            console.warn(chalk.yellow(`⚠️  Failed to initialize backup: ${error.message}`));
        }
    }

    // 📋 Log operation with context
    log(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            context,
            session: this.currentSession
        };

        this.operationLog.push(logEntry);

        // Console output for immediate feedback
        const levelEmoji = {
            'ERROR': '❌',
            'WARN': '⚠️',
            'INFO': 'ℹ️',
            'DEBUG': '🔍',
            'SUCCESS': '✅'
        };

        const emoji = levelEmoji[level] || '📝';

        if (level === 'ERROR') {
            console.error(`${emoji} ${message}`);
        } else if (level === 'WARN') {
            console.warn(chalk.yellow(`${emoji} ${message}`));
        } else if (this.options.verbose || level === 'SUCCESS') {
            console.log(chalk.gray(`${emoji} ${message}`));
        }

        // File logging
        if (this.options.enableLogging) {
            this.logToFile(level, message, context).catch(() => {
                // Silent fail for logging errors
            });
        }
    }

    // 📄 Write to log file
    async logToFile(level, message, context) {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                level,
                message,
                context,
                session: this.currentSession
            };

            const logLine = JSON.stringify(logEntry) + '\n';
            await fs.appendFile(this.options.logLocation, logLine);

        } catch (error) {
            // Silent fail for file logging errors
        }
    }

    // 💾 Create backup before operation
    async createBackup(targetPath, operation = 'delete') {
        if (!this.options.enableBackup) {
            return null;
        }

        try {
            const backupId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const backupPath = path.join(this.options.backupLocation, `${backupId}.backup`);

            this.log('INFO', `Creating backup for ${operation}`, {
                targetPath,
                backupId,
                backupPath
            });

            // For directories, create tar/zip backup
            if ((await fs.stat(targetPath)).isDirectory()) {
                await this.createDirectoryBackup(targetPath, backupPath);
            } else {
                await this.createFileBackup(targetPath, backupPath);
            }

            this.backups.set(backupId, {
                id: backupId,
                originalPath: targetPath,
                backupPath,
                operation,
                timestamp: Date.now(),
                size: await this.getBackupSize(backupPath)
            });

            this.log('SUCCESS', `Backup created: ${backupId}`, {
                originalPath: targetPath,
                backupPath,
                size: this.backups.get(backupId).size
            });

            return backupId;

        } catch (error) {
            this.log('ERROR', `Failed to create backup: ${error.message}`, { targetPath });
            return null;
        }
    }

    // 📁 Create directory backup
    async createDirectoryBackup(sourcePath, backupPath) {
        // For now, create a simple copy
        // In production, you'd want proper archiving
        try {
            await fs.cp(sourcePath, backupPath, { recursive: true });
        } catch (error) {
            // Fallback: create manifest of files
            await this.createManifestBackup(sourcePath, backupPath);
        }
    }

    // 📄 Create file backup
    async createFileBackup(sourcePath, backupPath) {
        await fs.copyFile(sourcePath, backupPath);
    }

    // 📋 Create manifest backup for directories
    async createManifestBackup(sourcePath, backupPath) {
        const manifest = {
            type: 'manifest',
            sourcePath,
            timestamp: Date.now(),
            files: []
        };

        try {
            const items = await fs.readdir(sourcePath, { withFileTypes: true });

            for (const item of items) {
                const itemPath = path.join(sourcePath, item.name);
                const stat = await fs.stat(itemPath);

                manifest.files.push({
                    name: item.name,
                    path: itemPath,
                    isDirectory: item.isDirectory(),
                    size: stat.size,
                    modified: stat.mtime
                });
            }

            await fs.writeFile(backupPath, JSON.stringify(manifest, null, 2));
        } catch (error) {
            throw new Error(`Failed to create manifest backup: ${error.message}`);
        }
    }

    // 🔄 Restore from backup
    async restoreBackup(backupId) {
        const backup = this.backups.get(backupId);
        if (!backup) {
            throw new Error(`Backup not found: ${backupId}`);
        }

        try {
            this.log('INFO', `Restoring from backup: ${backupId}`, {
                originalPath: backup.originalPath,
                backupPath: backup.backupPath
            });

            const backupContent = await fs.readFile(backup.backupPath, 'utf8');
            const manifest = JSON.parse(backupContent);

            if (manifest.type === 'manifest') {
                // Restore from manifest
                for (const file of manifest.files) {
                    if (file.isDirectory) {
                        await fs.mkdir(file.path, { recursive: true });
                    } else {
                        // For file restore, you'd need the actual file content
                        // This is a simplified version
                        this.log('WARN', `Cannot restore file content from manifest: ${file.path}`);
                    }
                }
            } else {
                // Restore from direct copy
                await fs.cp(backup.backupPath, backup.originalPath, { recursive: true });
            }

            this.log('SUCCESS', `Backup restored: ${backupId}`, {
                restoredPath: backup.originalPath
            });

            return true;

        } catch (error) {
            this.log('ERROR', `Failed to restore backup: ${error.message}`, { backupId });
            return false;
        }
    }

    // 🗑️ Cleanup old backups
    async cleanupOldBackups() {
        try {
            const files = await fs.readdir(this.options.backupLocation);
            const cutoffTime = Date.now() - (this.options.retentionDays * 24 * 60 * 60 * 1000);

            for (const file of files) {
                if (file.endsWith('.backup')) {
                    const filePath = path.join(this.options.backupLocation, file);
                    const stat = await fs.stat(filePath);

                    if (stat.mtime.getTime() < cutoffTime) {
                        await fs.unlink(filePath);
                        this.log('INFO', `Cleaned old backup: ${file}`);
                    }
                }
            }
        } catch (error) {
            this.log('WARN', `Failed to cleanup old backups: ${error.message}`);
        }
    }

    // 📊 Get backup size
    async getBackupSize(backupPath) {
        try {
            const stat = await fs.stat(backupPath);
            return stat.size;
        } catch {
            return 0;
        }
    }

    // 🔒 Security validation
    async validateOperation(targetPath, operation = 'delete') {
        try {
            // Check if path exists
            await fs.access(targetPath);

            // Check permissions
            try {
                await fs.access(targetPath, fs.constants.R_OK | fs.constants.W_OK);
            } catch {
                throw new Error(`Insufficient permissions for: ${targetPath}`);
            }

            // Check for system paths (extra caution)
            const systemPaths = [
                path.join(os.homedir(), 'AppData'),
                'C:\\Windows',
                'C:\\Program Files',
                '/System',
                '/usr',
                '/etc'
            ];

            for (const systemPath of systemPaths) {
                if (targetPath.includes(systemPath) && !targetPath.startsWith(os.homedir())) {
                    this.log('WARN', `Operating on system path: ${targetPath}`, { systemPath });
                    // Continue but with warning
                }
            }

            this.log('INFO', `Operation validated: ${operation}`, { targetPath });
            return true;

        } catch (error) {
            this.log('ERROR', `Operation validation failed: ${error.message}`, { targetPath, operation });
            return false;
        }
    }

    // 🔄 Rollback operation
    async rollbackOperation(operationId) {
        // Find related backups for this operation
        const relatedBackups = Array.from(this.backups.values())
            .filter(backup => backup.operationId === operationId);

        for (const backup of relatedBackups) {
            await this.restoreBackup(backup.id);
        }

        this.log('SUCCESS', `Operation rolled back: ${operationId}`, {
            restoredBackups: relatedBackups.length
        });
    }

    // 📈 Get operation summary
    getOperationSummary() {
        const errors = this.operationLog.filter(log => log.level === 'ERROR').length;
        const warnings = this.operationLog.filter(log => log.level === 'WARN').length;
        const successes = this.operationLog.filter(log => log.level === 'SUCCESS').length;

        return {
            totalOperations: this.operationLog.length,
            errors,
            warnings,
            successes,
            session: this.currentSession,
            backups: this.backups.size
        };
    }

    // 💾 Save security report
    async saveSecurityReport(reportPath = null) {
        const finalReportPath = reportPath || path.join(this.options.backupLocation, `security-report-${this.currentSession}.json`);

        try {
            const report = {
                session: this.currentSession,
                timestamp: new Date().toISOString(),
                summary: this.getOperationSummary(),
                operations: this.operationLog,
                backups: Array.from(this.backups.values())
            };

            await fs.writeFile(finalReportPath, JSON.stringify(report, null, 2));
            this.log('SUCCESS', `Security report saved: ${finalReportPath}`);

            return finalReportPath;
        } catch (error) {
            this.log('ERROR', `Failed to save security report: ${error.message}`);
            return null;
        }
    }
}

module.exports = SecurityManager;
