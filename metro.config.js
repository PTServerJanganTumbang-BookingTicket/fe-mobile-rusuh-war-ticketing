const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Path to signal-ui-react-shared (sibling in parent workspace)
const signalUIPath = path.resolve(__dirname, "../signal-ui-react-shared");

const config = getDefaultConfig(__dirname);

// Watch the signal-ui-react-shared directory for changes
config.watchFolders = [signalUIPath];

// Ensure React and React Native resolve from this app's node_modules
// to prevent duplicate runtime instances
config.resolver.extraNodeModules = {
  react: path.resolve(__dirname, "node_modules/react"),
  "react-native": path.resolve(__dirname, "node_modules/react-native"),
};

// Custom resolver for signal-ui-react-shared source consumption
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Resolve the main package entry
  if (moduleName === "signal-ui-react-shared") {
    return {
      filePath: path.join(signalUIPath, "src", "index.ts"),
      type: "sourceFile",
    };
  }
  // Resolve subpath imports (e.g., signal-ui-react-shared/components)
  if (moduleName.startsWith("signal-ui-react-shared/")) {
    const subPath = moduleName.replace("signal-ui-react-shared/", "");
    return {
      filePath: path.join(signalUIPath, "src", subPath),
      type: "sourceFile",
    };
  }
  // Fall back to default resolution
  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
