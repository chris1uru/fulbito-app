import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AdminVenueSelector({
  venues,
  reservationCounts,
  countsLoading,
  onSelect,
}) {
  const { bottom } = useSafeAreaInsets();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-4"
      contentContainerStyle={{ paddingBottom: bottom + 88 }}
    >
      <Text className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
        Complejos
      </Text>
      {venues.length === 0 ? (
        <View className="items-center rounded-3xl border border-dashed border-[#3B4249] bg-[#202428] px-6 py-12">
          <Ionicons name="business-outline" size={38} color="#69727B" />
          <Text className="mt-3 text-center text-[#A9B1B8]">
            No hay complejos disponibles.
          </Text>
        </View>
      ) : (
        venues.map((venue) => (
          <Pressable
            key={venue.id}
            onPress={() => onSelect(venue)}
            className="mb-3 flex-row overflow-hidden rounded-2xl border border-[#30363D] bg-[#202428]"
          >
            {venue.coverImageUrl ? (
              <Image
                source={{ uri: venue.coverImageUrl }}
                className="h-24 w-24"
                resizeMode="cover"
              />
            ) : (
              <View className="h-24 w-24 items-center justify-center bg-[#18231F]">
                <Ionicons name="business-outline" size={25} color="#80D160" />
              </View>
            )}
            <View className="flex-1 justify-center px-4">
              <Text numberOfLines={1} className="font-semibold text-white">
                {venue.name}
              </Text>
              <Text numberOfLines={1} className="mt-1 text-xs text-[#8B949E]">
                {venue.location?.city ?? "Ubicación pendiente"}
              </Text>
              {countsLoading ? (
                <View className="mt-2 h-4 w-28 rounded bg-[#30363D]" />
              ) : (
                <Text className="mt-2 text-xs font-semibold text-[#80D160]">
                  {reservationCounts[venue.id] == null
                    ? "Reservas de hoy no disponibles"
                    : `${reservationCounts[venue.id]} ${
                        reservationCounts[venue.id] === 1
                          ? "reserva"
                          : "reservas"
                      } hoy`}
                </Text>
              )}
            </View>
            <View className="items-center justify-center pr-3">
              <Ionicons name="chevron-forward" size={20} color="#69727B" />
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
