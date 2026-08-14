import { Stack } from "expo-router";
import { View, Text } from "react-native";

export default function Info() {
    return (
        <><Stack.Screen
            options={{
                headerShown:true,
                headerTitle: "Información",
                headerBackTitle: "",
            }} 
        />
            <View className="flex-1 items-center justify-center bg-black">
                <Text className="text-white">Información</Text>
            </View></>
    );
}
