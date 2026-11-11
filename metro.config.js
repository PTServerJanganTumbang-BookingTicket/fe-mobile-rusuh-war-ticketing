const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Path to signal-ui-react-shared (sibling in parent workspace)
const signalUIPath = path.resolve(__dirname, "../signal-ui-react-shared");

// Application-owned anchor file for redirecting package resolution.
// When imports from signal-ui source need to resolve bare packages,
// we re-resolve them as if originating from this fe-mobile source file.
const appAnchorPath = path.resolve(__dirname, "src/app/index.tsx");

const config = getDefaultConfig(__dirname);

// Watch the signal-ui-react-shared directory for changes
config.watchFolders = [signalUIPath];

// Prioritize fe-mobile's node_modules for package resolution.
// This works together with the origin-aware resolver below.
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
];

// Explicit package mappings as safeguards. These provide fallback resolution
// for critical runtime packages that must come from fe-mobile.
// react-native-css-interop is required because NativeWind's babel jsxImportSource
// transforms JSX to import from react-native-css-interop/jsx-runtime.
// @gluestack-ui/themed and @gluestack-style/react are required for TextField's
// Input/InputField/InputSlot/InputIcon imports from signal-ui-react-shared.
// react-native-svg is required because @gluestack-style/react/src/AsForwarder.tsx
// imports Svg.
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
  "react-native-svg": path.resolve(__dirname, "node_modules/react-native-svg"),
};

// Detect if a module specifier is a bare package import (not relative/absolute).
// Bare packages: 'react', 'react-native', '@gluestack-ui/themed', 'lodash/merge'
// NOT bare: './foo', '../bar', '/abs/path', 'signal-ui-react-shared/...'
function isBarePackageSpecifier(moduleName) {
  // Relative paths
  if (moduleName.startsWith("./") || moduleName.startsWith("../")) {
    return false;
  }
  // Absolute paths
  if (moduleName.startsWith("/")) {
    return false;
  }
  // signal-ui-react-shared imports are handled by direct source resolution
  if (moduleName === "signal-ui-react-shared" || moduleName.startsWith("signal-ui-react-shared/")) {
    return false;
  }
  // Everything else is a bare package specifier
  return true;
}

// Custom resolver for signal-ui-react-shared source consumption with
// origin-aware bare package resolution.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // ORIGIN-AWARE BARE PACKAGE RESOLUTION
  // When the import originates from within signal-ui-react-shared and is a
  // bare package specifier, resolve it as if originating from fe-mobile.
  // This prevents Metro's hierarchical lookup from finding packages in
  // signal-ui-react-shared/node_modules (which has incompatible versions).
  const isFromSignalUI = context.originModulePath.startsWith(signalUIPath);
  
  if (isFromSignalUI && isBarePackageSpecifier(moduleName)) {
    // Re-resolve with fe-mobile as the origin to get app-owned packages.
    // Use context.resolveRequest (the default resolver) with a modified origin.
    // This avoids infinite recursion because the new origin is NOT in signalUIPath.
    return context.resolveRequest(
      { ...context, originModulePath: appAnchorPath },
      moduleName,
      platform
    );
  }

  // SIGNAL-UI SOURCE RESOLUTION
  // Direct signal-ui-react-shared imports resolve to sibling src/ tree.
  
  // Resolve direct component imports (e.g., signal-ui-react-shared/components/Button)
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

  // DEFAULT RESOLUTION
  // All other imports use normal Metro resolution.
  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
