import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View, TextInput } from "react-native";
import Header from "../components/Header";

export default function MapsHeader() {
  return (
    <Header>
      <View className="mb-2 flex-row items-center gap-2">
        <View className=" flex-1 flex-row h-11 w-11 items-center rounded-md bg-[#2a2a2a] px-2 ">
          <Ionicons name="search" size={16} color="#A3A3A3" />

          <TextInput
            className="text-[#80D160] px-3"
            placeholder="Buscar cancha o zona..."
            placeholderTextColor={"#929292"}
          ></TextInput>
        </View>

        <Pressable className="h-11 w-11 items-center justify-center rounded-md bg-[#2A2A2A]">
          <Ionicons name="options-outline" size={18} color="white" />
        </Pressable>
      </View>

      <View className="flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center justify-between rounded-md bg-[#292D32] px-1 py-1">
          <Pressable className="h-7 w-7 items-center justify-center">
            <Ionicons name="chevron-back" size={18} color="#B7BDC3" />
          </Pressable>

          <Text className="text-center font-medium text-white">Jue.13.Ago</Text>

          <Pressable className="h-7 w-7 items-center justify-center">
            <Ionicons name="chevron-forward" size={18} color="#B7BDC3" />
          </Pressable>
        </View>

        <View className="flex-1 flex-row items-center justify-between rounded-md bg-[#292D32]">
          <Pressable className="flex-1 flex-row items-center justify-center rounded-md bg-[#292D32] px-3 py-2">
            <Ionicons name="time-outline" size={16} color="#B7BDC3" />
            <Text className="ml-2 font-medium text-white">18:00</Text>
            <Ionicons name="chevron-down" size={15} color="#B7BDC3" />
          </Pressable>
        </View>
      </View>
    </Header>
  );
}
