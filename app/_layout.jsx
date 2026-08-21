import "../global.css";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import AppAlertProvider from "../src/components/common/AppAlert";
import { AuthProvider, useAuth } from "../src/providers/AuthProvider";

export default function Layout() {
  return (
    <AuthProvider>
      <AppAlertProvider>
        <Navigator />
      </AppAlertProvider>
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
        <Stack.Screen name="profileEdit" />
        <Stack.Screen name="venueLayout" />
        <Stack.Screen name="reservaDetail" />
        <Stack.Protected
          guard={user?.role === "OWNER" || user?.role === "ADMIN"}
        >
          <Stack.Screen name="venueManagement" />
          <Stack.Screen name="manageVenue" />
          <Stack.Screen name="venueForm" />
          <Stack.Screen name="courtManagement" />
          <Stack.Screen name="courtForm" />
          <Stack.Screen name="scheduleManagement" />
          <Stack.Screen name="manualReservation" />
          <Stack.Screen name="imageManagement" />
        </Stack.Protected>
        <Stack.Protected guard={user?.role === "ADMIN"}>
          <Stack.Screen name="userManagement" />
          <Stack.Screen name="userForm" />
        </Stack.Protected>
      </Stack.Protected>
    </Stack>
  );
}
