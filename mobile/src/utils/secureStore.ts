import * as SecureStore from "expo-secure-store";

export const getItem = (key: string) => {
  return SecureStore.getItem(key);
};

export const setItem = (key: string, data: string) => {
  SecureStore.setItem(key, data);
};

export const deleteItem = async (key: string) => {
  try {
    await SecureStore.deleteItemAsync(key);
    console.log(`Item with key "${key}" deleted successfully.`);
    return true;
  } catch (error) {
    console.error("An error occurred while deleting the item:", error);
    return null;
  }
};
