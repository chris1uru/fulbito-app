import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View, TextInput } from "react-native";
import AppHeader from "../../../components/common/AppHeader";

export default function MapsHeader() {
  return (
    <AppHeader>
      <View className="mb-2 flex-row items-center gap-2">
        <View className="h-12 flex-1 flex-row items-center rounded-xl border border-[#30363D] bg-[#202428] px-3">
          <Ionicons name="search" size={18} color="#80D160" />

          <TextInput
            className="h-full flex-1 px-3 text-white"
            placeholder="Buscar cancha o zona..."
            placeholderTextColor={"#8B949E"}
          ></TextInput>
        </View>

        <Pressable className="h-12 w-12 items-center justify-center rounded-xl bg-[#2C4930]">
          <Ionicons name="options-outline" size={20} color="#80D160" />
        </Pressable>
      </View>

      <View className="flex-row items-center gap-2">
        <View className="h-11 flex-1 flex-row items-center justify-between rounded-xl border border-[#30363D] bg-[#202428] px-1">
          <Pressable className="h-9 w-9 items-center justify-center rounded-lg bg-[#292D32]">
            <Ionicons name="chevron-back" size={17} color="#A9B1B8" />
          </Pressable>

          <Text className="text-center text-sm font-semibold text-white">
            Jue.13.Ago
          </Text>

          <Pressable className="h-9 w-9 items-center justify-center rounded-lg bg-[#292D32]">
            <Ionicons name="chevron-forward" size={17} color="#A9B1B8" />
          </Pressable>
        </View>

        <View className="h-11 flex-1 flex-row items-center justify-between rounded-xl border border-[#30363D] bg-[#202428]">
          <Pressable className="h-full flex-1 flex-row items-center justify-center rounded-xl px-3">
            <Ionicons name="time-outline" size={17} color="#80D160" />
            <Text className="ml-2 text-sm font-semibold text-white">18:00</Text>
            <Ionicons
              name="chevron-down"
              size={15}
              color="#8B949E"
              style={{ marginLeft: 6 }}
            />
          </Pressable>
        </View>
      </View>
    </AppHeader>
  );
}
