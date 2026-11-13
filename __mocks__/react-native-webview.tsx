/**
 * Mock for react-native-webview
 */
import React from "react";
import { View } from "react-native";

export type WebViewProps = {
  source?: { uri: string };
  originWhitelist?: string[];
  onShouldStartLoadWithRequest?: (request: { url: string }) => boolean;
  onMessage?: (event: { nativeEvent: { data: string; url: string } }) => void;
  onError?: (event: { nativeEvent: { description?: string } }) => void;
  javaScriptEnabled?: boolean;
  setSupportMultipleWindows?: boolean;
  allowFileAccess?: boolean;
  sharedCookiesEnabled?: boolean;
  cacheEnabled?: boolean;
  mediaPlaybackRequiresUserAction?: boolean;
  startInLoadingState?: boolean;
  testID?: string;
  style?: object;
};

function WebView(props: WebViewProps) {
  return <View testID={props.testID || "mock-webview"} />;
}

export default WebView;
