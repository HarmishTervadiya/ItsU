import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWallet } from "@/src/hooks/useWallet";
import ToastManager from "toastify-react-native";
import { getCalendars } from "expo-localization";
import { updateUserData } from "@/src/api/user";

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

      <TouchableOpacity
        onPress={() =>
          updateUserData({
            name: "Test User",
            email: "test@gmail.com",
            timezone: getCalendars()[0].timeZone,
          })
        }
      >
        <Text>Update User Data</Text>
      </TouchableOpacity>
      <ToastManager />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
