import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export default function BookingCard({ booking }) {
  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-[#30363D] bg-[#202428] p-3">
      <View className="flex-row gap-3">
        <View className="h-28 w-24 items-center justify-center rounded-xl border border-dashed border-[#4A5158] bg-[#292D32]">
          <Ionicons name="image-outline" size={25} color="#69727B" />
          <Text className="mt-1 text-center text-[10px] text-[#8B949E]">
            Imagen de cancha
          </Text>
        </View>

        <View className="flex-1 justify-between py-1">
          <View>
            <Text className="text-lg font-semibold text-white">
              {booking.name}
            </Text>
            <Text className="mt-1 text-xs text-[#A9B1B8]">
              {booking.date} · {booking.time}
            </Text>
          </View>

          <View className="self-start rounded-md bg-[#2C4930] px-2 py-1">
            <Text className="text-xs font-semibold text-[#80D160]">
              Faltan {booking.remainingTime}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-3 border-t border-[#30363D] pt-3">
        <View className="mb-2 flex-row items-center">
          <Ionicons name="location-outline" size={16} color="#A9B1B8" />
          <Text className="ml-2 flex-1 text-xs text-[#C5CBD1]">
            {booking.address}
          </Text>
        </View>

        <View className="mb-3 flex-row items-center">
          <Ionicons name="call-outline" size={15} color="#A9B1B8" />
          <Text className="ml-2 text-xs text-[#C5CBD1]">{booking.phone}</Text>
        </View>

        <Pressable className="flex-row items-center justify-center rounded-lg bg-[#80D160] py-2.5">
          <Text className="mr-2 text-sm font-semibold text-[#152012]">
            Ver complejo
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#152012" />
        </Pressable>
      </View>
    </View>
  );
}
