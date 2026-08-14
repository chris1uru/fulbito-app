import "../global.css";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";

export default function Layout() {
  return (
    <AuthProvider>
      <Navigator />
    </AuthProvider>
  );
}

function Navigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="loginScreen" />
        <Stack.Screen name="register" />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}
