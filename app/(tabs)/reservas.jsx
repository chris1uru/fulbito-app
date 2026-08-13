import { Link } from "expo-router";
import { View, Text } from "react-native";

export default function Reservas() {
    return (
        <View className="flex-1 items-center justify-center bg-black">
            <Link href="/info" className="mb-4">
                <Text className="text-lg text-green-700">Ir a Información</Text>
            </Link>
            <Text className="text-lg text-white">Pantalla de Reservas</Text>
        </View>
    );
}
