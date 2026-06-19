import * as Device from "expo-device";
import { Platform } from "react-native";

function requirePublicEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Set ${name} before starting Scribe.`);
  }

  return value.replace(/\/$/, "");
}

function requireDeviceAccessibleUrl(name: string, value: string | undefined) {
  const url = requirePublicEnv(name, value);
  const hostname = new URL(url).hostname;
  const isLoopback =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

  if (Platform.OS !== "web" && Device.isDevice && isLoopback) {
    throw new Error(
      `${name} uses localhost, which points to this iPhone. Use your Mac's LAN IP instead.`,
    );
  }

  return url;
}

export function getApiBaseUrl() {
  return requireDeviceAccessibleUrl(
    "EXPO_PUBLIC_API_BASE_URL",
    process.env.EXPO_PUBLIC_API_BASE_URL,
  );
}

export function getCollaborationUrl() {
  return requireDeviceAccessibleUrl(
    "EXPO_PUBLIC_COLLABORATION_URL",
    process.env.EXPO_PUBLIC_COLLABORATION_URL,
  );
}

export function getDocumentId() {
  return requirePublicEnv(
    "EXPO_PUBLIC_DOCUMENT_ID",
    process.env.EXPO_PUBLIC_DOCUMENT_ID,
  );
}
