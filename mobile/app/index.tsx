import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWallet } from "@/src/hooks/useWallet";

export default function HomeScreen() {
  const wallet = useWallet();
  return (
    <SafeAreaView className="flex">
      <View>
        <Text className="text-3xl text-red-700">
          Wallet Public Key: {wallet.publicKey?.toString()}
        </Text>
        <TouchableOpacity onPress={wallet.signInWithSolana}>
          <Text>Connect Wallet</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
