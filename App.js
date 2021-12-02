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

Amplify.configure({
  ...config,
  Analytics: {
    disabled: true,
  },
});

function App() {
  const [map, setMap] = useState(emptyMap);
  const [ourPlayerType, setOurPlayerType] = useState(null);
  const [currentTurn, setCurrentTurn] = useState("X");

  const [gameMode, setGameMode] = useState("BOT_MEDIUM"); // LOCAL, BOT_EASY, BOT_MEDIUM;
  const [game, setGame] = useState(null);
  const [userData, setUserData] = useState(null);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    resetGame();
    if (gameMode === "ONLINE") {
      findOrCreateOnlineGame();
    } else {
      deleteTemporaryGame();
    }
    setCurrentTurn("X");
    if (gameMode !== "ONLINE") {
      setOurPlayerType("X");
    }
  }, [gameMode]);

  useEffect(() => {
    if (currentTurn === "O" && ["BOT_EASY", "BOT_MEDIUM"].includes(gameMode)) {
      const chosenOption = botTurn(map, gameMode);
      if (chosenOption) {
        onPress(chosenOption.row, chosenOption.col);
      }
    }
  }, [currentTurn, gameMode]);

  useEffect(() => {
    updateGame();
  }, [currentTurn]);





  useEffect(() => {
    if (gameFinished) {
      return;
    }
    const winner = getWinner(map);
    if (winner) {
      gameWon(winner);
      setGameFinished(true)
    } else {
      checkTieState();
      
    }
    
  }, [map]);




  useEffect(() => {
    Auth.currentAuthenticatedUser().then(setUserData);
  }, []);

  useEffect(() => {
    if (!game) {
      return;
    }
    //subscribe to updates
    const subscription = DataStore.observe(Game, game.id).subscribe((msg) => {
      console.log(msg.model, msg.opType, msg.element);
      const newGame = msg.element;
      if (msg.opType === "UPDATE") {
        // setGame((g) => ({ ...g, ...newGame }));
        setGame(newGame);
        if (newGame.map) {
          setMap(JSON.parse(msg.element.map));
        }
        if (newGame.currentPlayer) {
          setCurrentTurn(msg.element.currentPlayer);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [game?.id]);

  const findOrCreateOnlineGame = async () => {
    const games = await getAvailableGames();

    if (games.length > 0) {
      joinGame(games[0]);
    } else {
      await createNewGame();
    }
  };

  const joinGame = async (game) => {
    const updatedGame = await DataStore.save(
      Game.copyOf(game, (updatedGame) => {
        updatedGame.playerO = userData.attributes.sub;
      })
    );
    setGame(updatedGame);
    setOurPlayerType("O");
  };

  const getAvailableGames = async () => {
    const games = await DataStore.query(Game, (g) => g.playerO("eq", ""));
    return games;
  };

  const createNewGame = async () => {
    const emptyStringMap = JSON.stringify([
      ["", "", ""], // 1st row
      ["", "", ""], // 2nd row
      ["", "", ""], // 3rd row
    ]);

    const newGame = new Game({
      playerX: userData.attributes.sub,
      playerO: "",
      map: emptyStringMap,
      currentPlayer: "X",
      pointsX: 0,
      pointsO: 0,
    });

    const createdGame = await DataStore.save(newGame);
    setGame(createdGame);
    setOurPlayerType("X");
  };

  const updateGame = () => {
    if (!game) {
      return;
    }
    DataStore.save(
      Game.copyOf(game, (g) => {
        g.currentPlayer = currentTurn;
        g.map = JSON.stringify(map);
      })
    );
  };

  const deleteTemporaryGame = async () => {
    if (!game || game.playerO) {
      setGame(null);
      return;
    }
    await DataStore.delete(Game, game.id);
    setGame(null);
  };

  const onPress = (rowIndex, columnIndex) => {
    if (gameMode === "ONLINE" && currentTurn !== ourPlayerType) {
      Alert.alert("Not your turn homie");
      return;
    }
    if (map[rowIndex][columnIndex] !== "") {
      Alert.alert("Position already occupied");
      return;
    }

    setMap((existingMap) => {
      const updatedMap = [...existingMap];
      updatedMap[rowIndex][columnIndex] = currentTurn;
      return updatedMap;
    });

    setCurrentTurn(currentTurn === "X" ? "O" : "X");
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
      gameFinished(true);
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
    setCurrentTurn("X");
    setGameFinished(false);
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
