#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const gradient = require('gradient-string');
const boxen = require('boxen');
const { Select, Toggle, MultiSelect } = require('enquirer');
const UltraSystemCleaner = require('../lib/cleaner');
const ConfigManager = require('../lib/config-manager');

// 🎨 Beautiful ASCII Art Header
function displayHeader() {
    console.clear();
    
    const title = figlet.textSync('ULTRA CLEAN', {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    });
    
    const gradientTitle = gradient(['#ff6b6b', '#4ecdc4', '#45b7d1'])(title);
    
    console.log(gradientTitle);
    console.log(gradient('#ff6b6b', '#4ecdc4')(
        '═'.repeat(70)
    ));
    
    const subtitle = boxen(
        chalk.white.bold('🔥 Ultra-System-Cleaner v1.0.0 🔥\n') +
        chalk.gray('Cross-Platform System Cleanup Tool\n') +
        chalk.cyan('Made with ❤️  by George Pricop (@Gzeu)'),
        {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan',
            backgroundColor: '#1a1a1a'
        }
    );
    
    console.log(subtitle);
}

// 🔧 Interactive Mode
async function interactiveMode() {
    displayHeader();
    
    // Mode selection
    const modePrompt = new Select({
        name: 'mode',
        message: '🚀 Choose cleanup mode:',
        choices: [
            { name: 'quick', message: '⚡ Quick Clean (Recommended)', hint: 'Fast cleanup of common temp files' },
            { name: 'deep', message: '🔥 Deep Clean', hint: 'Thorough system cleanup' },
            { name: 'custom', message: '🎯 Custom Clean', hint: 'Choose specific areas to clean' },
            { name: 'dry-run', message: '🧪 Dry Run', hint: 'Preview what will be cleaned' }
        ]
    });
    
    const mode = await modePrompt.run();
    
    let options = { verbose: true };
    
    if (mode === 'dry-run') {
        options.dryRun = true;
    }
    
    if (mode === 'custom') {
        const customPrompt = new MultiSelect({
            name: 'areas',
            message: '🎯 Select areas to clean:',
            choices: [
                { name: 'system', message: '💻 System Temp Files' },
                { name: 'user', message: '👤 User Data Cache' },
                { name: 'browsers', message: '🌐 Browser Cache' },
                { name: 'apps', message: '📱 Application Cache' },
                { name: 'npm', message: '📦 NPM Cache' },
                { name: 'logs', message: '📋 Log Files' }
            ]
        });
        
        options.customAreas = await customPrompt.run();
    }
    
    // Confirmation for destructive operations
    if (!options.dryRun) {
        const confirmPrompt = new Toggle({
            name: 'confirm',
            message: '⚠️  Proceed with cleanup? (This will delete files)',
            enabled: 'Yes, clean it!',
            disabled: 'No, cancel'
        });
        
        const confirmed = await confirmPrompt.run();
        if (!confirmed) {
            console.log(chalk.yellow('\n✋ Operation cancelled by user.'));
            process.exit(0);
        }
    }
    
    return options;
}

// 🎯 Main CLI Logic
async function main() {
    program
        .version('1.0.0')
        .description('🔥 Ultra System Cleaner - Cross-platform system cleanup tool')
        .option('-q, --quick', '⚡ Quick cleanup mode')
        .option('-d, --deep', '🔥 Deep cleanup mode') 
        .option('-i, --interactive', '🎯 Interactive mode (default)')
        .option('--dry-run', '🧪 Preview mode - don\'t delete anything')
        .option('-v, --verbose', '📝 Verbose output')
        .option('-y, --yes', '✅ Skip confirmations')
        .option('--no-color', '🎨 Disable colors')
        .option('-c, --config <path>', '📋 Use custom configuration file')
        .option('--save-config <path>', '💾 Save current settings to config file')
        .action(async (options) => {
            try {
                // Handle no-color option
                if (options.noColor) {
                    chalk.level = 0;
                }

                // Load configuration file
                const configManager = new ConfigManager();
                const config = await configManager.loadConfig(options.config);

                let cleanupOptions = {
                    verbose: options.verbose || false,
                    dryRun: options.dryRun || false,
                    skipConfirmation: options.yes || false
                };

                // Merge configuration with CLI options
                cleanupOptions = configManager.mergeOptions(cleanupOptions);

                // Interactive mode by default if no specific mode chosen
                if (!options.quick && !options.deep && !options.interactive) {
                    cleanupOptions = await interactiveMode();
                } else if (options.interactive || (!options.quick && !options.deep)) {
                    cleanupOptions = await interactiveMode();
                } else {
                    displayHeader();

                    if (options.quick) {
                        cleanupOptions.mode = 'quick';
                    } else if (options.deep) {
                        cleanupOptions.mode = 'deep';
                    }
                }

                // Save config if requested
                if (options.saveConfig) {
                    configManager.config = { ...config, ...cleanupOptions };
                    await configManager.saveConfig(options.saveConfig);
                    console.log(chalk.green(`✅ Configuration saved to: ${options.saveConfig}`));
                    return;
                }

                // Run the cleaner
                const cleaner = new UltraSystemCleaner(cleanupOptions);
                await cleaner.run();
                
            } catch (error) {
                console.error(chalk.red('\n❌ Error occurred:'), error.message);
                if (options.verbose) {
                    console.error(chalk.gray(error.stack));
                }
                process.exit(1);
            }
        });

    program.parse();
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(chalk.red('\n💥 Uncaught Exception:'), error.message);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error(chalk.red('\n💥 Unhandled Rejection:'), error.message);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n👋 Cleanup interrupted by user. Exiting safely...'));
    process.exit(0);
});

main();