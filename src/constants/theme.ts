/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";
import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#26231f",
    textSecondary: "#625b52",
    background: "#f7f5f0",
    surface: "#fffdf8",
    surfaceRaised: "#ffffff",
    border: "#d8d2c7",
    error: "#a12828",
  },
  dark: {
    text: "#f4efe7",
    textSecondary: "#bdb5aa",
    background: "#191714",
    surface: "#24211d",
    surfaceRaised: "#2d2924",
    border: "#504940",
    error: "#ff9b9b",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui",
    serif: "Georgia",
    rounded: "system-ui",
    mono: "monospace",
  },
});
