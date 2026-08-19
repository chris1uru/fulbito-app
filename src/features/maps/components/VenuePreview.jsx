import { Image, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function VenuePreview({ venue, onClose }) {
  return (
    <View className="absolute bottom-5 left-4 right-4 overflow-hidden rounded-3xl border border-[#30363D] bg-[#202428]">
      <View className="relative items-center justify-center bg-[#18231F]">
        <Pressable
          onPress={onClose}
          className="absolute right-3 top-3 z-10 h-9 w-9 items-center justify-center rounded-xl border border-[#3B4249] bg-[#17191C]"
        >
          <Ionicons name="close" size={21} color="#FFFFFF" />
        </Pressable>

        {venue.coverImageUrl ? (
          <Image
            source={{ uri: venue.coverImageUrl }}
            className="h-40 w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-40 w-full items-center justify-center bg-[#18231F]">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#2C4930]">
              <Ionicons name="image-outline" size={24} color="#80D160" />
            </View>
            <Text className="mt-2 text-center text-xs text-[#8B949E]">
              Imagen de cancha
            </Text>
          </View>
        )}
      </View>

      <View className="p-4">
        <Text className="text-xl font-bold text-white">{venue.name}</Text>
        <Text className="mt-1.5 text-sm leading-5 text-[#C5CBD1]">
          {venue.description}
        </Text>

        <View className="mt-3 flex-row items-center">
          <View className="mr-2 h-8 w-8 items-center justify-center rounded-lg bg-[#2C4930]">
            <Ionicons name="call-outline" size={16} color="#80D160" />
          </View>
          <Text className="text-sm text-[#A9B1B8]">{venue.phone}</Text>
        </View>

        <Link
          href={{ pathname: "/venueLayout", params: { venueId: venue.id } }}
          asChild
        >
          <Pressable className="mt-4 flex-row items-center justify-center rounded-xl bg-[#80D160] py-3.5">
            <Text className="font-semibold text-[#152012]">Ver complejo</Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color="#152012"
              style={{ marginLeft: 8 }}
            />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
