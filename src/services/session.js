import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "fulbito_access_token";
const ONBOARDING_PREFIX = "fulbito_onboarding_";

function onboardingKey(userId) {
  return `${ONBOARDING_PREFIX}${userId}`;
}

export const getToken = () =>
  Platform.OS === "web"
    ? Promise.resolve(globalThis.sessionStorage?.getItem(KEY) ?? null)
    : SecureStore.getItemAsync(KEY);

export const saveToken = (token) =>
  Platform.OS === "web"
    ? Promise.resolve(globalThis.sessionStorage?.setItem(KEY, token))
    : SecureStore.setItemAsync(KEY, token);

export const removeToken = () =>
  Platform.OS === "web"
    ? Promise.resolve(globalThis.sessionStorage?.removeItem(KEY))
    : SecureStore.deleteItemAsync(KEY);

export const hasCompletedOnboarding = (userId) => {
  const key = onboardingKey(userId);
  return Platform.OS === "web"
    ? Promise.resolve(globalThis.localStorage?.getItem(key) === "true")
    : SecureStore.getItemAsync(key).then((value) => value === "true");
};

export const saveOnboardingCompleted = (userId) => {
  const key = onboardingKey(userId);
  return Platform.OS === "web"
    ? Promise.resolve(globalThis.localStorage?.setItem(key, "true"))
    : SecureStore.setItemAsync(key, "true");
};
