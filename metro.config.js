const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Path to signal-ui-react-shared (sibling in parent workspace)
const signalUIPath = path.resolve(__dirname, "../signal-ui-react-shared");

const config = getDefaultConfig(__dirname);

// Watch the signal-ui-react-shared directory for changes
config.watchFolders = [signalUIPath];

// Ensure React, React Native, css-interop, and Gluestack resolve from this app's
// node_modules to prevent duplicate runtime instances when bundling sibling
// signal-ui source. react-native-css-interop is required because NativeWind's
// babel jsxImportSource transforms JSX to import from react-native-css-interop/jsx-runtime.
// @gluestack-ui/themed and @gluestack-style/react are required for TextField's
// Input/InputField/InputSlot/InputIcon imports from signal-ui-react-shared.
config.resolver.extraNodeModules = {
  react: path.resolve(__dirname, "node_modules/react"),
  "react-native": path.resolve(__dirname, "node_modules/react-native"),
  "react-native-css-interop": path.resolve(
    __dirname,
    "node_modules/react-native-css-interop"
  ),
  "@gluestack-ui/themed": path.resolve(
    __dirname,
    "node_modules/@gluestack-ui/themed"
  ),
  "@gluestack-style/react": path.resolve(
    __dirname,
    "node_modules/@gluestack-style/react"
  ),
};

// Custom resolver for signal-ui-react-shared source consumption
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Resolve direct component imports (e.g., signal-ui-react-shared/components/Button)
  // These resolve to the index.tsx file within the component directory
  if (moduleName === "signal-ui-react-shared/components/Button") {
    return {
      filePath: path.join(signalUIPath, "src", "components", "Button", "index.tsx"),
      type: "sourceFile",
    };
  }
  if (moduleName === "signal-ui-react-shared/components/Text") {
    return {
      filePath: path.join(signalUIPath, "src", "components", "Text", "index.tsx"),
      type: "sourceFile",
    };
  }
  if (moduleName === "signal-ui-react-shared/components/TextField") {
    return {
      filePath: path.join(signalUIPath, "src", "components", "TextField", "index.tsx"),
      type: "sourceFile",
    };
  }
  // Resolve the main package entry (used for type exports)
  if (moduleName === "signal-ui-react-shared") {
    return {
      filePath: path.join(signalUIPath, "src", "index.ts"),
      type: "sourceFile",
    };
  }
  // Resolve other subpath imports (e.g., signal-ui-react-shared/theme/tokens)
  if (moduleName.startsWith("signal-ui-react-shared/")) {
    const subPath = moduleName.replace("signal-ui-react-shared/", "");
    // Try with .ts extension first
    const tsPath = path.join(signalUIPath, "src", subPath + ".ts");
    const tsxPath = path.join(signalUIPath, "src", subPath + ".tsx");
    const indexPath = path.join(signalUIPath, "src", subPath, "index.ts");
    const indexTsxPath = path.join(signalUIPath, "src", subPath, "index.tsx");
    
    // Check which file exists (synchronously for resolver)
    const fs = require("fs");
    if (fs.existsSync(tsPath)) {
      return { filePath: tsPath, type: "sourceFile" };
    }
    if (fs.existsSync(tsxPath)) {
      return { filePath: tsxPath, type: "sourceFile" };
    }
    if (fs.existsSync(indexPath)) {
      return { filePath: indexPath, type: "sourceFile" };
    }
    if (fs.existsSync(indexTsxPath)) {
      return { filePath: indexTsxPath, type: "sourceFile" };
    }
    // Fallback to direct path (for directories)
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
