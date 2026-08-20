import { Text, View } from "react-native";
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
      <View className="mb-4 items-center">
        <Text className="text-2xl font-semibold tracking-tight text-white">
          Ful<Text className="text-[#80D160]">bito</Text>
        </Text>
      </View>

      {children}
    </View>
  );
}
