const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

const finalConfig = withNativeWind(config, { input: './global.css' });

// Modules to stub/alias for native bundling:
// - nativewind/jsx-dev-runtime & jsx-runtime: expo-router v55 hardcodes NativeWind v4 imports
// - react-dom/client: @expo/log-box 55.0.7 imports it inside web-only code paths
const NATIVE_STUBS = {
  'nativewind/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
  'nativewind/jsx-runtime': require.resolve('react/jsx-runtime'),
  'react-dom/client': path.resolve(__dirname, 'stubs/react-dom-client.js'),
};

const originalResolveRequest = finalConfig.resolver.resolveRequest;
finalConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (NATIVE_STUBS[moduleName]) {
    return { filePath: NATIVE_STUBS[moduleName], type: 'sourceFile' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = finalConfig;
