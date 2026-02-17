import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex">
      <View>
        <Text className="text-3xl text-red-700">index</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
