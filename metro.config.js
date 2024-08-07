/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
const defaultSourceExts =
  require('metro-config/src/defaults/defaults').sourceExts; // Detox recommended

module.exports = {
  resolver: {
    sourceExts:
      process.env.MY_APP_MODE === 'mocked'
        ? ['mock.js', ...defaultSourceExts]
        : defaultSourceExts,
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
