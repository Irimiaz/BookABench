import React from "react";
import { SplashScreen } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import BlankBackground from "../components/BlankBackground";
import Stacks from "./navigation/Stacks";

SplashScreen.preventAutoHideAsync();

const styles = StyleSheet.create({
  debugBox: {
    position: "absolute",
    top: 40,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 8,
    borderRadius: 8,
    zIndex: 9999,
  },
  debugText: {
    color: "white",
    fontSize: 12,
    fontFamily: "monospace",
  },
});

export default function App() {
  return (
    <>
      {/* <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}> */}
      <BlankBackground>
        <>
          <Stacks />
        </>
      </BlankBackground>
      {/* </ThemeProvider> */}
    </>
  );
}
