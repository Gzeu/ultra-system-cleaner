const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const chalk = require('chalk');

class AnalyticsManager {
    constructor(options = {}) {
        this.options = {
            enableAnalytics: true,
            analyticsLocation: path.join(os.homedir(), '.ultra-cleaner-analytics'),
            maxHistoryDays: 90,
            autoCleanup: true,
            ...options
        };

        this.analyticsData = {
            version: '1.0',
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            sessions: [],
            summary: {
                totalSessions: 0,
                totalFilesCleaned: 0,
                totalSpaceRecovered: 0,
                averageSessionSize: 0,
                mostActiveDay: null,
                favoriteCleanupMode: null
            }
        };

        this.currentSession = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            operations: [],
            summary: {
                filesCleaned: 0,
                spaceRecovered: 0,
                areasProcessed: 0,
                errors: 0,
                duration: 0
            }
        };
    }

    // 🔢 Generate unique session ID
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 📊 Initialize analytics system
    async initialize() {
        if (!this.options.enableAnalytics) {
            return;
        }

        try {
            // Ensure analytics directory exists
            await fs.mkdir(this.options.analyticsLocation, { recursive: true });

            // Load existing analytics data
            await this.loadAnalyticsData();

            // Cleanup old data if enabled
            if (this.options.autoCleanup) {
                await this.cleanupOldData();
            }

            console.log(chalk.gray(`📊 Analytics system initialized: ${this.options.analyticsLocation}`));

        } catch (error) {
            console.warn(chalk.yellow(`⚠️  Failed to initialize analytics: ${error.message}`));
        }
    }

    // 💾 Load existing analytics data
    async loadAnalyticsData() {
        try {
            const analyticsPath = path.join(this.options.analyticsLocation, 'analytics.json');
            const data = await fs.readFile(analyticsPath, 'utf8');
            this.analyticsData = JSON.parse(data);

            // Convert date strings back to Date objects
            this.analyticsData.sessions = this.analyticsData.sessions.map(session => ({
                ...session,
                startTime: new Date(session.startTime),
                endTime: new Date(session.endTime)
            }));

        } catch (error) {
            // File doesn't exist or is corrupted, start fresh
            this.analyticsData = {
                version: '1.0',
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                sessions: [],
                summary: {
                    totalSessions: 0,
                    totalFilesCleaned: 0,
                    totalSpaceRecovered: 0,
                    averageSessionSize: 0,
                    mostActiveDay: null,
                    favoriteCleanupMode: null
                }
            };
        }
    }

    // 📈 Track operation
    trackOperation(operation) {
        if (!this.options.enableAnalytics) {
            return;
        }

        const operationData = {
            id: this.generateSessionId(),
            timestamp: new Date().toISOString(),
            type: operation.type || 'unknown',
            category: operation.category || 'general',
            description: operation.description || '',
            filesAffected: operation.files || 0,
            sizeRecovered: operation.size || 0,
            duration: operation.duration || 0,
            success: operation.success !== false,
            error: operation.error || null,
            metadata: operation.metadata || {}
        };

        this.currentSession.operations.push(operationData);

        // Update current session summary
        if (operationData.success) {
            this.currentSession.summary.filesCleaned += operationData.filesAffected;
            this.currentSession.summary.spaceRecovered += operationData.sizeRecovered;
            this.currentSession.summary.areasProcessed++;
        } else {
            this.currentSession.summary.errors++;
        }
    }

    // ⏱️ Track session timing
    startSession() {
        this.currentSession.startTime = Date.now();
    }

    endSession() {
        if (!this.options.enableAnalytics) {
            return;
        }

        this.currentSession.endTime = Date.now();
        this.currentSession.summary.duration = this.currentSession.endTime - this.currentSession.startTime;

        // Add session to analytics data
        this.analyticsData.sessions.push({
            ...this.currentSession,
            startTime: new Date(this.currentSession.startTime),
            endTime: new Date(this.currentSession.endTime)
        });

        // Update summary statistics
        this.updateSummaryStats();

        // Save to disk
        this.saveAnalyticsData();

        // Reset current session
        this.currentSession = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            operations: [],
            summary: {
                filesCleaned: 0,
                spaceRecovered: 0,
                areasProcessed: 0,
                errors: 0,
                duration: 0
            }
        };
    }

    // 📊 Update summary statistics
    updateSummaryStats() {
        const sessions = this.analyticsData.sessions;
        const summary = this.analyticsData.summary;

        summary.totalSessions = sessions.length;

        if (sessions.length > 0) {
            summary.totalFilesCleaned = sessions.reduce((sum, s) => sum + s.summary.filesCleaned, 0);
            summary.totalSpaceRecovered = sessions.reduce((sum, s) => sum + s.summary.spaceRecovered, 0);
            summary.averageSessionSize = summary.totalSpaceRecovered / sessions.length;

            // Find most active day
            const dayCounts = {};
            sessions.forEach(session => {
                const day = session.startTime.toISOString().split('T')[0];
                dayCounts[day] = (dayCounts[day] || 0) + 1;
            });

            const mostActiveDay = Object.entries(dayCounts).sort(([,a], [,b]) => b - a)[0];
            summary.mostActiveDay = mostActiveDay ? mostActiveDay[0] : null;

            // Find favorite cleanup mode (simplified for MVP)
            summary.favoriteCleanupMode = 'interactive'; // Will be enhanced later
        }
    }

    // 💾 Save analytics data to disk
    async saveAnalyticsData() {
        try {
            this.analyticsData.lastUpdated = new Date().toISOString();
            const analyticsPath = path.join(this.options.analyticsLocation, 'analytics.json');
            await fs.writeFile(analyticsPath, JSON.stringify(this.analyticsData, null, 2));
        } catch (error) {
            console.warn(chalk.yellow(`⚠️  Failed to save analytics: ${error.message}`));
        }
    }

    // 🧹 Cleanup old analytics data
    async cleanupOldData() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.options.maxHistoryDays);

            this.analyticsData.sessions = this.analyticsData.sessions.filter(session => {
                return new Date(session.startTime) > cutoffDate;
            });

            // Update summary after cleanup
            this.updateSummaryStats();
            await this.saveAnalyticsData();

        } catch (error) {
            console.warn(chalk.yellow(`⚠️  Failed to cleanup old analytics: ${error.message}`));
        }
    }

    // 📋 Generate analytics report
    async generateReport(format = 'json', options = {}) {
        const report = {
            generated: new Date().toISOString(),
            format,
            period: options.period || 'all',
            data: this.getAnalyticsReportData(options)
        };

        switch (format) {
            case 'html':
                return this.generateHTMLReport(report);
            case 'csv':
                return this.generateCSVReport(report);
            case 'json':
            default:
                return this.generateJSONReport(report);
        }
    }

    // 📊 Get report data
    getAnalyticsReportData(options = {}) {
        const sessions = this.analyticsData.sessions;
        const summary = this.analyticsData.summary;

        // Filter sessions by period if specified
        let filteredSessions = sessions;
        if (options.period && options.period !== 'all') {
            const now = new Date();
            const daysBack = parseInt(options.period.replace('days', ''));
            const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

            filteredSessions = sessions.filter(session =>
                new Date(session.startTime) > cutoffDate
            );
        }

        return {
            summary,
            sessions: filteredSessions,
            trends: this.calculateTrends(filteredSessions),
            topCategories: this.getTopCategories(filteredSessions),
            timeAnalysis: this.getTimeAnalysis(filteredSessions)
        };
    }

    // 📈 Calculate trends
    calculateTrends(sessions) {
        if (sessions.length < 2) {
            return { trend: 'insufficient_data' };
        }

        const recent = sessions.slice(-7); // Last 7 sessions
        const previous = sessions.slice(-14, -7); // Previous 7 sessions

        if (recent.length === 0 || previous.length === 0) {
            return { trend: 'insufficient_data' };
        }

        const recentAvg = recent.reduce((sum, s) => sum + s.summary.spaceRecovered, 0) / recent.length;
        const previousAvg = previous.reduce((sum, s) => sum + s.summary.spaceRecovered, 0) / previous.length;

        const trend = recentAvg > previousAvg ? 'increasing' :
                     recentAvg < previousAvg ? 'decreasing' : 'stable';

        return {
            trend,
            recentAverage: recentAvg,
            previousAverage: previousAvg,
            changePercent: previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg * 100) : 0
        };
    }

    // 🏆 Get top categories
    getTopCategories(sessions) {
        const categoryStats = {};

        sessions.forEach(session => {
            session.operations.forEach(op => {
                if (!categoryStats[op.category]) {
                    categoryStats[op.category] = {
                        operations: 0,
                        files: 0,
                        size: 0
                    };
                }

                categoryStats[op.category].operations++;
                categoryStats[op.category].files += op.filesAffected;
                categoryStats[op.category].size += op.sizeRecovered;
            });
        });

        return Object.entries(categoryStats)
            .map(([category, stats]) => ({ category, ...stats }))
            .sort((a, b) => b.size - a.size)
            .slice(0, 5);
    }

    // ⏰ Time analysis
    getTimeAnalysis(sessions) {
        const hourStats = Array(24).fill(0);
        const dayStats = {};

        sessions.forEach(session => {
            const hour = new Date(session.startTime).getHours();
            hourStats[hour]++;

            const day = new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'long' });
            dayStats[day] = (dayStats[day] || 0) + 1;
        });

        return {
            favoriteHour: hourStats.indexOf(Math.max(...hourStats)),
            favoriteDay: Object.entries(dayStats).sort(([,a], [,b]) => b - a)[0]?.[0] || null,
            hourDistribution: hourStats,
            dayDistribution: dayStats
        };
    }

    // 📄 Generate JSON report
    generateJSONReport(report) {
        return JSON.stringify(report, null, 2);
    }

    // 📊 Generate CSV report
    generateCSVReport(report) {
        const data = report.data;
        let csv = 'Metric,Value\n';

        // Summary stats
        csv += `Total Sessions,${data.summary.totalSessions}\n`;
        csv += `Total Files Cleaned,${data.summary.totalFilesCleaned}\n`;
        csv += `Total Space Recovered,${data.summary.totalSpaceRecovered}\n`;
        csv += `Average Session Size,${data.summary.averageSessionSize}\n`;

        // Trends
        if (data.trends.trend !== 'insufficient_data') {
            csv += `Trend,${data.trends.trend}\n`;
            csv += `Trend Change %,${data.trends.changePercent.toFixed(2)}\n`;
        }

        // Top categories
        data.topCategories.forEach((cat, index) => {
            csv += `Top Category ${index + 1},${cat.category}\n`;
            csv += `Top Category ${index + 1} Size,${cat.size}\n`;
        });

        return csv;
    }

    // 🌐 Generate HTML report
    generateHTMLReport(report) {
        const data = report.data;

        return `
<!DOCTYPE html>
<html>
<head>
    <title>Ultra System Cleaner - Analytics Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2 { color: #333; }
        .metric { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .metric strong { color: #007bff; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
        .trend-up { color: #28a745; }
        .trend-down { color: #dc3545; }
        .trend-stable { color: #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Ultra System Cleaner - Analytics Report</h1>
        <p><strong>Generated:</strong> ${new Date(report.generated).toLocaleString()}</p>
        <p><strong>Period:</strong> ${report.period}</p>

        <h2>📈 Summary Statistics</h2>
        <div class="metric">
            <strong>Total Sessions:</strong> ${data.summary.totalSessions}
        </div>
        <div class="metric">
            <strong>Total Files Cleaned:</strong> ${data.summary.totalFilesCleaned.toLocaleString()}
        </div>
        <div class="metric">
            <strong>Total Space Recovered:</strong> ${this.formatBytes(data.summary.totalSpaceRecovered)}
        </div>
        <div class="metric">
            <strong>Average Session Size:</strong> ${this.formatBytes(Math.round(data.summary.averageSessionSize))}
        </div>

        ${data.trends.trend !== 'insufficient_data' ? `
        <h2>📈 Trend Analysis</h2>
        <div class="metric">
            <strong>Trend:</strong>
            <span class="trend-${data.trends.trend}">
                ${data.trends.trend.charAt(0).toUpperCase() + data.trends.trend.slice(1)}
                (${data.trends.changePercent > 0 ? '+' : ''}${data.trends.changePercent.toFixed(1)}%)
            </span>
        </div>` : ''}

        <h2>🏆 Top Categories</h2>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Operations</th>
                    <th>Files</th>
                    <th>Space Recovered</th>
                </tr>
            </thead>
            <tbody>
                ${data.topCategories.map(cat => `
                <tr>
                    <td>${cat.category}</td>
                    <td>${cat.operations}</td>
                    <td>${cat.files}</td>
                    <td>${this.formatBytes(cat.size)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        ${data.timeAnalysis.favoriteDay ? `
        <h2>⏰ Time Analysis</h2>
        <div class="metric">
            <strong>Most Active Day:</strong> ${data.timeAnalysis.favoriteDay}
        </div>
        <div class="metric">
            <strong>Most Active Hour:</strong> ${data.timeAnalysis.favoriteHour}:00
        </div>` : ''}
    </div>
</body>
</html>`;
    }

    // 🔢 Format bytes for display
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 📋 Get current session summary
    getCurrentSessionSummary() {
        return {
            ...this.currentSession.summary,
            duration: Date.now() - this.currentSession.startTime,
            operationCount: this.currentSession.operations.length
        };
    }

    // 🎯 Export analytics data
    async exportAnalytics(targetPath, format = 'json') {
        try {
            const report = await this.generateReport(format);
            await fs.writeFile(targetPath, report);
            console.log(chalk.green(`✅ Analytics exported to: ${targetPath}`));
            return targetPath;
        } catch (error) {
            console.error(chalk.red(`❌ Failed to export analytics: ${error.message}`));
            return null;
        }
    }
}

module.exports = AnalyticsManager;
