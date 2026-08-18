import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function AppHeader({ children }) {
  const { top } = useSafeAreaInsets();
  return (
    <View
      className="left-0 right-0 z-10 bg-[#080B0D] px-3 pb-3"
      style={{ paddingTop: top + 8 }}
    >
      <StatusBar style="light" backgroundColor="#080B0D" translucent={false} />
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable className="h-8 w-8 items-center justify-center">
          <Ionicons name="menu" size={30} color="white" />
        </Pressable>

        <Text className="text-3xl font-semibold text-white ">
          Ful<Text className="text-[#80D160]">bito</Text>
        </Text>

        <Pressable className="h-8 w-8 items-center justify-center">
          <Ionicons name="notifications-outline" size={25} color="white" />
        </Pressable>
      </View>

      {children}
    </View>
  );
}
