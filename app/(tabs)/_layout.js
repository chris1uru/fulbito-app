import { Tabs } from "expo-router";

import { MapsIcon, InfoIcon } from "../../components/Icons";

export default function TabsLayout() {
    return (
        <Tabs>

            <Tabs.Screen name="maps" options={{ title: "Map", tabBarIcon: ({ color }) => <MapsIcon color={color} /> }} />
            <Tabs.Screen name="info" options={{ title: "Info", tabBarIcon: ({ color }) => <InfoIcon color={color} /> }} />

        </Tabs>
    );
}
