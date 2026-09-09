import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const FAVORITES_KEY = "fulbito_favorite_venues";
const MAP_SELECTION_KEY = "fulbito_map_selection";

async function readValue(key) {
  return Platform.OS === "web"
    ? (globalThis.localStorage?.getItem(key) ?? null)
    : SecureStore.getItemAsync(key);
}

async function writeValue(key, value) {
  return Platform.OS === "web"
    ? Promise.resolve(globalThis.localStorage?.setItem(key, value))
    : SecureStore.setItemAsync(key, value);
}

export async function getFavoriteVenueIds() {
  try {
    const parsed = JSON.parse((await readValue(FAVORITES_KEY)) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((value) => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export async function saveFavoriteVenueIds(ids) {
  await writeValue(FAVORITES_KEY, JSON.stringify([...new Set(ids)]));
}

export async function getMapSelection() {
  try {
    const parsed = JSON.parse((await readValue(MAP_SELECTION_KEY)) ?? "null");
    return parsed &&
      typeof parsed.date === "string" &&
      typeof parsed.time === "string"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export async function saveMapSelection(selection) {
  await writeValue(MAP_SELECTION_KEY, JSON.stringify(selection));
}
