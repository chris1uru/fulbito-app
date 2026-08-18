import { Image, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function VenuePreview({ venue, onClose }) {
  return (
    <View className="absolute bottom-6 left-4 right-4 rounded-xl bg-zinc-900/90 p-4">
      <View className="relative items-center justify-center rounded-xl border border-[#30363D] bg-[#202428]">
        <Pressable onPress={onClose} className=" absolute right-2 top-0 z-10">
          <Text className="text-3xl text-white">×</Text>
        </Pressable>

        {venue.coverImageUrl ? (
          <Image
            source={{ uri: venue.coverImageUrl }}
            className="h-40 w-full rounded-xl"
            resizeMode="cover"
          />
        ) : (
          <View className="h-40 w-full items-center justify-center rounded-xl border border-dashed border-gray-500 bg-gray-800">
            <Ionicons name="image-outline" size={25} color="#69727B" />
            <Text className="mt-1 text-center text-[10px] text-[#8B949E]">
              Imagen de cancha
            </Text>
          </View>
        )}
      </View>

      <Text className="mt-3 text-2xl font-bold text-white">{venue.name}</Text>
      <Text className="mt-1 text-zinc-200 text-xl">{venue.description}</Text>

      <Text className="mt-1 text-zinc-400">{venue.phone}</Text>

      <Link
        href={{ pathname: "/venueLayout", params: { venueId: venue.id } }}
        asChild
      >
        <Pressable className=" mt-3 flex-row items-center justify-center rounded-lg bg-[#80D160] py-3">
          <Text className="font-semibold text-black">Ver complejo</Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color="#152012"
            style={{ marginLeft: 8 }}
          />
        </Pressable>
      </Link>
    </View>
  );
}
