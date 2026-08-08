module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        // The preset auto-injects the worklets/reanimated Babel plugin when the
        // package is installed. Disabled here so the explicit entry in `plugins`
        // below is the single source of truth (and is not applied twice).
        { reanimated: false, worklets: false },
      ],
    ],
    plugins: [
      // Must stay last. In Reanimated 4 this file re-exports
      // `react-native-worklets/plugin`.
      'react-native-reanimated/plugin',
    ],
  };
};
