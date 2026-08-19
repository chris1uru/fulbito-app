import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AccountIcon,
  CalendarIcon,
  MapsIcon,
  MessageIcon,
} from "../../src/components/navigation/TabBarIcons";

export default function TabsLayout() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#17191C",
          borderTopColor: "transparent",
          paddingTop: 5,
          paddingBottom: bottom + 10,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },

        tabBarActiveTintColor: "#80D160",
        tabBarInactiveTintColor: "white",
      }}
    >
      <Tabs.Screen
        name="maps"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <MapsIcon color={color} />,
        }}
      />

      <Tabs.Screen
        name="reservas"
        options={{
          title: "Mis Reservas",
          tabBarIcon: ({ color }) => <CalendarIcon color={color} />,
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <AccountIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
