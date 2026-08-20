import { Tabs } from "expo-router";

import {
  AccountIcon,
  CalendarIcon,
  MapsIcon,
} from "../../src/components/navigation/TabBarIcons";
import FloatingTabBar from "../../src/components/navigation/FloatingTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="maps"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <MapsIcon color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="reservas"
        options={{
          title: "Mis Reservas",
          tabBarIcon: ({ color, size }) => (
            <CalendarIcon color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <AccountIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
