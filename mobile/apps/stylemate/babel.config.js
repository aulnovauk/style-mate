module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@core': '../../packages/core',
            '@ui': '../../packages/ui',
            '@theme': '../../packages/theme',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
