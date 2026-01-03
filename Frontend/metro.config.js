const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block the problematic Cache module from pdf-lib
config.resolver.blockList = [
  /node_modules\/pdf-lib\/es\/utils\/Cache\.js$/,
];

module.exports = config;