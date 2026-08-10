import { Tabs } from "expo-router";

import { MapsIcon, CalendarIcon } from "../../components/Icons";

export default function TabsLayout() {
    return (
        <Tabs>

            <Tabs.Screen name="maps" options={{ title: "Map", tabBarIcon: ({ color }) => <MapsIcon color={color} /> }} />
            <Tabs.Screen name="reservas" options={{ title: "Mis Reservas", tabBarIcon: ({ color }) => <CalendarIcon color={color} /> }} />
            <Tabs.Screen name="message" options={{ title: "Mensajes", tabBarIcon: ({ color }) => <CalendarIcon color={color} /> }} />
            <Tabs.Screen name="perfil" options={{ title: "Perfil", tabBarIcon: ({ color }) => <CalendarIcon color={color} /> }} />
            
        </Tabs>
    );
}
