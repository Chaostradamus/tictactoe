import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import { Text, View, ImageBackground, Alert } from "react-native";
import bg from "./assets/bg.jpeg";
import Cell from "./src/components/Cell";
import { emptyMap } from "./src/utils";
import { getWinner, isTie } from "./src/utils/gameLogic";
import { botTurn } from "./src/utils/bot";

import Amplify from "@aws-amplify/core";
import { DataStore } from "@aws-amplify/datastore";
import { Auth } from "aws-amplify";
import { withAuthenticator } from "aws-amplify-react-native";
import config from "./src/aws-exports";
import styles from "./App.style";

import { Game } from "./src/models";

Amplify.configure(config);

function App() {
  const [map, setMap] = useState(emptyMap);
  const [currentTurn, setCurrentTurn] = useState("x");

  const [gameMode, setGameMode] = useState("BOT_MEDIUM"); // LOCAL, BOT_EASY, BOT_MEDIUM;
  const [game, setGame] = useState(null);

  useEffect(() => {
    if (gameMode === "ONLINE") {
      findOrCreateOnlineGame();
    }
  }, [gameMode]);

  useEffect(() => {
    if (currentTurn === "o" && gameMode !== "LOCAL") {
      const chosenOption = botTurn(map, gameMode);
      if (chosenOption) {
        onPress(chosenOption.row, chosenOption.col);
      }
    }
  }, [currentTurn, gameMode]);

  useEffect(() => {
    const winner = getWinner(map);
    if (winner) {
      gameWon(winner);
    } else {
      checkTieState();
    }
  }, [map]);

  const findOrCreateOnlineGame = async () => {
    const games = await getAvailableGames();
    console.log(games);
    // create new
    await createNewGame();
  };

  const getAvailableGames = async () => {
    const games = await DataStore.query(Game);
    return games;
  };

  const createNewGame = async () => {
    const userData = await Auth.currentAuthenticatedUser();

    const emptyStringMap = JSON.stringify(emptyMap);

    const newGame = new Game({
      playerX: userData.attributes.sub,
      map: emptyStringMap,
      currentPlayer: "X",
      pointsX: 0,
      pointsO: 0,
    });
    console.log(newGame);
    const createdGame = await DataStore.save(newGame);
    setGame(createdGame);
  };

  const onPress = (rowIndex, columnIndex) => {
    if (map[rowIndex][columnIndex] !== "") {
      Alert.alert("Position already occupied");
      return;
    }

    setMap((existingMap) => {
      const updatedMap = [...existingMap];
      updatedMap[rowIndex][columnIndex] = currentTurn;
      return updatedMap;
    });

    setCurrentTurn(currentTurn === "x" ? "o" : "x");
  };

  const onLogout = async () => {
    await DataStore.clear();
    Auth.signOut();
  };

  const checkTieState = () => {
    if (isTie(map)) {
      Alert.alert(`It's a tie`, `tie`, [
        {
          text: "Restart",
          onPress: resetGame,
        },
      ]);
    }
  };

  const gameWon = (player) => {
    Alert.alert(`Huraaay`, `Player ${player} won`, [
      {
        text: "Restart",
        onPress: resetGame,
      },
    ]);
  };

  const resetGame = () => {
    setMap([
      ["", "", ""], // 1st row
      ["", "", ""], // 2nd row
      ["", "", ""], // 3rd row
    ]);
    setCurrentTurn("x");
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={bg} style={styles.bg} resizeMode="contain">
        <Text
          style={{
            fontSize: 24,
            color: "white",
            position: "absolute",
            top: 50,
          }}
        >
          Current Turn: {currentTurn.toUpperCase()}
        </Text>

        {game && <Text style={{ color: "white" }}>Game id: {game.id}</Text>}

        <View style={styles.map}>
          {map.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.row}>
              {row.map((cell, columnIndex) => (
                <Cell
                  key={`row-${rowIndex}-col-${columnIndex}`}
                  cell={cell}
                  onPress={() => onPress(rowIndex, columnIndex)}
                />
              ))}
            </View>
          ))}
        </View>

        <View style={styles.buttons}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Text
              onPress={() => setGameMode("LOCAL")}
              style={[
                styles.button,
                {
                  backgroundColor: gameMode === "LOCAL" ? "#4F5686" : "#191F24",
                },
              ]}
            >
              Local
            </Text>
            <Text
              onPress={() => setGameMode("BOT_EASY")}
              style={[
                styles.button,
                {
                  backgroundColor:
                    gameMode === "BOT_EASY" ? "#4F5686" : "#191F24",
                },
              ]}
            >
              Easy Bot
            </Text>
            <Text
              onPress={() => setGameMode("BOT_MEDIUM")}
              style={[
                styles.button,
                {
                  backgroundColor:
                    gameMode === "BOT_MEDIUM" ? "#4F5686" : "#191F24",
                },
              ]}
            >
              Medium Bot
            </Text>

            <Text
              onPress={() => setGameMode("ONLINE")}
              style={[
                styles.button,
                {
                  backgroundColor:
                    gameMode === "ONLINE" ? "#4F5686" : "#191F24",
                },
              ]}
            >
              ONLINE
            </Text>
          </View>

          <Text onPress={() => onLogout()} style={styles.logout}>
            Logout
          </Text>
        </View>
      </ImageBackground>

      <StatusBar style="auto" />
    </View>
  );
}

export default withAuthenticator(App);
