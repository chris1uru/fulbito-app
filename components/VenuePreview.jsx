import { Image, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";

export default function VenuePreview({ venue, onClose }) {
  return (
    <View className="absolute bottom-6 left-4 right-4 rounded-3xl bg-zinc-900 p-4">
      
      <Pressable
        onPress={onClose}
        className="absolute right-4 top-4 z-10"
      >
        <Text className="text-xl text-white">×</Text>
      </Pressable>

      <Image
        source={{ uri: venue.image }}
        className="h-36 w-full rounded-2xl"
      />

      <Text className="mt-3 text-xl font-bold text-white">
        {venue.name}
      </Text>

      <Text className="mt-1 text-zinc-400">
        {venue.phone}
      </Text>
      <Link href="../venueLayout" asChild>
        <Pressable className="mt-4 items-center rounded-xl bg-green-500 py-3">
          <Text className="font-semibold text-black">
            Ver complejo
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}