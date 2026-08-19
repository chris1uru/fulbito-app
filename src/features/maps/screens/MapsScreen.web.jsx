import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import AppHeader from "../../../components/common/AppHeader";
import { venuesApi } from "../../../services/api";

function addressOf(location) {
  if (!location) return "Ubicación pendiente";
  return [location.street, location.streetNumber, location.city]
    .filter(Boolean)
    .join(" · ");
}

function VenueCard({ venue }) {
  return (
    <View className="mb-4 overflow-hidden rounded-3xl border border-[#30363D] bg-[#202428]">
      {venue.coverImageUrl ? (
        <Image
          source={{ uri: venue.coverImageUrl }}
          className="h-48 w-full"
          resizeMode="cover"
        />
      ) : (
        <View className="h-36 items-center justify-center bg-[#18231F]">
          <Ionicons name="image-outline" size={36} color="#69727B" />
          <Text className="mt-2 text-sm text-[#8B949E]">Sin portada</Text>
        </View>
      )}
      <View className="p-5">
        <View className="flex-row items-start justify-between">
          <View className="mr-4 flex-1">
            <Text className="text-xl font-bold text-white">{venue.name}</Text>
            <View className="mt-2 flex-row items-start">
              <Ionicons name="location-outline" size={17} color="#80D160" />
              <Text className="ml-2 flex-1 text-sm text-[#A9B1B8]">
                {addressOf(venue.location)}
              </Text>
            </View>
          </View>
          <View className="rounded-full bg-[#142019] px-3 py-1.5">
            <Text className="text-xs font-semibold text-[#80D160]">Activo</Text>
          </View>
        </View>

        {!!venue.description && (
          <Text
            numberOfLines={2}
            className="mt-4 text-sm leading-5 text-[#C5CBD1]"
          >
            {venue.description}
          </Text>
        )}

        <Link
          href={{ pathname: "/venueLayout", params: { venueId: venue.id } }}
          asChild
        >
          <Pressable className="mt-5 flex-row items-center justify-center rounded-xl bg-[#80D160] py-3.5">
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

export default function MapsScreenWeb() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    venuesApi
      .publicList()
      .then(setVenues)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#080B0D" }}>
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: "100%",
          maxWidth: 900,
          alignSelf: "center",
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 40,
        }}
      >
        <Text className="text-3xl font-bold text-white">
          Encontrá tu cancha
        </Text>
        <Text className="mb-6 mt-2 text-[#A9B1B8]">
          Complejos disponibles en Fulbito
        </Text>

        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#80D160" />
          </View>
        ) : error ? (
          <View className="rounded-2xl border border-[#653B40] bg-[#2B2225] p-5">
            <Text className="text-center text-[#F08A93]">{error}</Text>
          </View>
        ) : venues.length === 0 ? (
          <View className="items-center rounded-3xl border border-dashed border-[#3B4249] bg-[#202428] px-6 py-12">
            <Ionicons name="business-outline" size={42} color="#69727B" />
            <Text className="mt-4 text-lg font-semibold text-white">
              No hay complejos publicados
            </Text>
          </View>
        ) : (
          venues.map((venue) => <VenueCard key={venue.id} venue={venue} />)
        )}
      </ScrollView>
    </View>
  );
}
