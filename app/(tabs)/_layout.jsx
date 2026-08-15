import { Tabs } from "expo-router";

import { MapsIcon, CalendarIcon, MessageIcon, AccountIcon } from "../../components/Icons";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false, 
                tabBarStyle: {
                    backgroundColor: "#1E1E1E",
                    borderTopColor: "transparent",
                    height: 72,
                    paddingTop: 7,
                    paddingBottom: 7,
                },

                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "500",
                },

                tabBarActiveTintColor: "#80D160",
                tabBarInactiveTintColor: "#777",
            }}
        >

            <Tabs.Screen name="maps" options={{ title: "Map", tabBarIcon: ({ color }) => <MapsIcon color={color} /> }} />
            
            <Tabs.Screen name="reservas" options={{ title: "Mis Reservas", tabBarIcon: ({ color }) => <CalendarIcon color={color} /> }} />
            
            <Tabs.Screen name="message" options={{ title: "Mensajes", tabBarIcon: ({ color }) => <MessageIcon color={color} /> }} />
            
            <Tabs.Screen name="perfil" options={{ title: "Perfil", tabBarIcon: ({ color }) => <AccountIcon color={color} /> }} />
            
        </Tabs>
    );
}
