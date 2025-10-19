/**
 * Ultra System Cleaner
 * Cross-platform system cleanup tool with beautiful CLI interface
 * 
 * @author George Pricop (@Gzeu)
 * @license MIT
 */

const UltraSystemCleaner = require('./cleaner');

module.exports = {
    UltraSystemCleaner,
    // For convenience, also export as default
    default: UltraSystemCleaner
};

// Also allow require('ultra-system-cleaner').UltraSystemCleaner
// or require('ultra-system-cleaner') directly for the class
module.exports.UltraSystemCleaner = UltraSystemCleaner;