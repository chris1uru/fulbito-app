import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "fulbito_access_token";

export const getToken = () =>
  Platform.OS === "web"
    ? Promise.resolve(globalThis.localStorage?.getItem(KEY) ?? null)
    : SecureStore.getItemAsync(KEY);

export const saveToken = (token) =>
  Platform.OS === "web"
    ? Promise.resolve(globalThis.localStorage?.setItem(KEY, token))
    : SecureStore.setItemAsync(KEY, token);

export const removeToken = () =>
  Platform.OS === "web"
    ? Promise.resolve(globalThis.localStorage?.removeItem(KEY))
    : SecureStore.deleteItemAsync(KEY);
