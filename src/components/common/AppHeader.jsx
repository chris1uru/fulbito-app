import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function AppHeader({ children }) {
  const { top } = useSafeAreaInsets();
  return (
    <View
      className="left-0 right-0 z-10 border-b border-[#30363D] bg-[#17191C] px-4 pb-4"
      style={{ paddingTop: top + 10 }}
    >
      <StatusBar style="light" backgroundColor="#17191C" translucent={false} />
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable className="h-10 w-10 items-center justify-center rounded-xl border border-[#30363D] bg-[#202428]">
          <Ionicons name="menu" size={23} color="#FFFFFF" />
        </Pressable>

        <Text className="text-2xl font-semibold tracking-tight text-white">
          Ful<Text className="text-[#80D160]">bito</Text>
        </Text>

        <Pressable className="h-10 w-10 items-center justify-center rounded-xl bg-[#2C4930]">
          <Ionicons name="notifications-outline" size={21} color="#80D160" />
        </Pressable>
      </View>

      {children}
    </View>
  );
}
