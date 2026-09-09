import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import useFavoriteVenues from "../../../hooks/useFavoriteVenues";
import { venuesApi } from "../../../services/api";
import {
  addUruguayDays,
  nextUruguayHourSelection,
  uruguayDateKey,
} from "../../../utils/uruguayDateTime";
import MapsHeader from "../components/MapsHeader";

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function searchableVenueText(venue) {
  return normalize(
    [
      venue.name,
      venue.description,
      venue.location?.street,
      venue.location?.neighborhood,
      venue.location?.city,
      venue.location?.departmentName,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function addressOf(location) {
  if (!location) return "Ubicación pendiente";
  return [location.street, location.streetNumber, location.city]
    .filter(Boolean)
    .join(" · ");
}

function VenueCard({ venue, availability, favorite, onToggleFavorite }) {
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              favorite
                ? `Quitar ${venue.name} de favoritos`
                : `Agregar ${venue.name} a favoritos`
            }
            onPress={() => onToggleFavorite(venue.id)}
            className="h-11 w-11 items-center justify-center rounded-xl bg-[#292D32]"
          >
            <Ionicons
              name={favorite ? "heart" : "heart-outline"}
              size={21}
              color={favorite ? "#80D160" : "#A9B1B8"}
            />
          </Pressable>
        </View>

        <View
          className={`mt-4 self-start rounded-full px-3 py-1.5 ${
            availability?.available ? "bg-[#142019]" : "bg-[#292D32]"
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              availability?.available ? "text-[#80D160]" : "text-[#A9B1B8]"
            }`}
          >
            {availability == null
              ? "Disponibilidad sin cargar"
              : availability.available
                ? `${availability.availableCourts.length} ${
                    availability.availableCourts.length === 1
                      ? "cancha disponible"
                      : "canchas disponibles"
                  }`
                : "Sin disponibilidad en este horario"}
          </Text>
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
  const [selection, setSelection] = useState(nextUruguayHourSelection);
  const [venues, setVenues] = useState([]);
  const [availabilityResponse, setAvailabilityResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [error, setError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [query, setQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const { favoriteVenueIds, toggleFavoriteVenue } = useFavoriteVenues();

  useEffect(() => {
    setLoading(true);
    setError("");
    venuesApi
      .publicList()
      .then(setVenues)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  useEffect(() => {
    let active = true;
    setAvailabilityLoading(true);
    setAvailabilityError("");
    venuesApi
      .availabilityHour(selection.date, selection.time)
      .then((data) => {
        if (active) setAvailabilityResponse(data);
      })
      .catch((requestError) => {
        if (active) setAvailabilityError(requestError.message);
      })
      .finally(() => {
        if (active) setAvailabilityLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey, selection.date, selection.time]);

  const availabilityByVenue = useMemo(
    () =>
      Object.fromEntries(
        (availabilityResponse?.venues ?? []).map((item) => [
          item.venueId,
          item,
        ]),
      ),
    [availabilityResponse],
  );
  const visibleVenues = useMemo(() => {
    const normalizedQuery = normalize(query);
    return venues.filter((venue) => {
      const availability = availabilityByVenue[venue.id];
      return (
        (!normalizedQuery ||
          searchableVenueText(venue).includes(normalizedQuery)) &&
        (!onlyAvailable || availability?.available) &&
        (!onlyFavorites || favoriteVenueIds.includes(venue.id))
      );
    });
  }, [
    availabilityByVenue,
    favoriteVenueIds,
    onlyAvailable,
    onlyFavorites,
    query,
    venues,
  ]);

  const today = uruguayDateKey();

  function changeDate(amount) {
    setSelection((current) => ({
      ...current,
      date: addUruguayDays(current.date, amount),
    }));
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#080B0D" }}>
      <MapsHeader
        query={query}
        onQueryChange={setQuery}
        selectedDate={selection.date}
        canGoPrevious={selection.date > today}
        onPreviousDate={() => changeDate(-1)}
        onNextDate={() => changeDate(1)}
        onDateChange={(date) =>
          setSelection((current) => ({ ...current, date }))
        }
        selectedTime={selection.time}
        onTimeChange={(time) =>
          setSelection((current) => ({ ...current, time }))
        }
        onlyAvailable={onlyAvailable}
        onOnlyAvailableChange={setOnlyAvailable}
        onlyFavorites={onlyFavorites}
        onOnlyFavoritesChange={setOnlyFavorites}
      />
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
          {availabilityLoading
            ? "Consultando disponibilidad..."
            : `${visibleVenues.length} complejos para tu búsqueda`}
        </Text>

        {!!availabilityError && (
          <View className="mb-4 rounded-xl border border-[#6B5730] bg-[#2A261D] p-3">
            <Text className="text-sm text-[#E7C778]">
              No se pudo actualizar la disponibilidad: {availabilityError}
            </Text>
          </View>
        )}

        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#80D160" />
          </View>
        ) : error ? (
          <View className="rounded-2xl border border-[#653B40] bg-[#2B2225] p-5">
            <Text className="text-center text-[#F08A93]">{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setReloadKey((value) => value + 1)}
              className="mt-4 min-h-12 items-center justify-center rounded-xl border border-[#653B40]"
            >
              <Text className="font-semibold text-[#F08A93]">Reintentar</Text>
            </Pressable>
          </View>
        ) : visibleVenues.length === 0 ? (
          <View className="items-center rounded-3xl border border-dashed border-[#3B4249] bg-[#202428] px-6 py-12">
            <Ionicons name="business-outline" size={42} color="#69727B" />
            <Text className="mt-4 text-lg font-semibold text-white">
              No encontramos complejos con estos filtros
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-4">
            {visibleVenues.map((venue) => (
              <View key={venue.id} style={{ flexBasis: 360, flexGrow: 1 }}>
                <VenueCard
                  venue={venue}
                  availability={availabilityByVenue[venue.id]}
                  favorite={favoriteVenueIds.includes(venue.id)}
                  onToggleFavorite={toggleFavoriteVenue}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
