module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind v5: no jsxImportSource / nativewind preset needed (applied via metro).
    presets: ["babel-preset-expo"],
    // Reanimated v4 ships its worklets plugin separately; must be last.
    plugins: ["react-native-worklets/plugin"],
  };
};
