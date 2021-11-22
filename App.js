import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View, ImageBackground } from "react-native";
import bg from "./assets/bg.jpeg";

export default function App() {
  return (
    <View style={styles.container}>
      <ImageBackground source={bg} style={styles.bg} resizeMode="contain">
        <View style={styles.map}>
          <View style={styles.circle} />

          <View style={styles.cross}>
            <View style={styles.crossLine} />
            <View style={[styles.crossLine, styles.crossLineReversed]} />
          </View>
        </View>
      </ImageBackground>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#242d34",
  },
  bg: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",

    paddingTop: 15,
  },
  map: {
    borderWidth: 1,
    borderColor: "white",
    width: "80%",
    aspectRatio: 1,
  },
  circle: {
    position: "absolute",

    left: 1 * 120,
    top: 2 * 115,

    width: 75,
    height: 75,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    margin: 10,

    borderWidth: 10,
    borderColor: "white",
  },
  cross: {
    width: 75,
    height: 75,
    position: "absolute",
  },
  crossLine: {
    position: "absolute",
    left: 32.5,
    width: 10,
    height: 70,
    backgroundColor: "white",
    borderRadius: 5,
    transform: [
      {
        rotate: "45deg",
      },
    ],
  },
  crossLineReversed: {
    transform: [
      {
        rotate: "-45deg",
      },
    ],
  },
});
