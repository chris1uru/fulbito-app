import { Tabs } from "expo-router";

import {
  AccountIcon,
  BusinessIcon,
  CalendarIcon,
  MapsIcon,
} from "../../src/components/navigation/TabBarIcons";
import FloatingTabBar from "../../src/components/navigation/FloatingTabBar";
import { useAuth } from "../../src/providers/AuthProvider";

export default function TabsLayout() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";

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
          href: isOwner ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <MapsIcon color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="reservas"
        options={{
          title:
            user?.role === "OWNER"
              ? "Agenda"
              : user?.role === "ADMIN"
                ? "Reservas"
                : "Mis Reservas",
          tabBarIcon: ({ color, size }) => (
            <CalendarIcon color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="complejos"
        options={{
          title: "Mis complejos",
          href: isOwner ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <BusinessIcon color={color} size={size} />
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
