import { Stack } from "expo-router";
import { View, Text } from "react-native";

export default function Info() {
    return (
        <><Stack.Screen
            options={{
                headerStyle: { opacity: 0.9, backgroundColor: "#1E1E1E" },
                headerTitle: "Información",
                headerTitleStyle: { color: "#80D160" },
            }} 
        />
            
            <View className="flex-1 items-center justify-center bg-black">
                <Text className="text-white">Información</Text>
            </View></>
    );
}
