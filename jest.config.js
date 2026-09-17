module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-mmkv|react-native-android-widget|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-svg|@op-engineering/op-sqlite)/)',
  ],
};
