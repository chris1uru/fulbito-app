import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  courtsApi,
  imagesApi,
  scheduleApi,
  venuesApi,
} from "../../../services/api";
import VenueCourtCard from "../components/VenueCourtCard";

const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function buildAddress(location) {
  if (!location) return "Ubicación no informada";
  const street = [location.street, location.streetNumber]
    .filter(Boolean)
    .join(" ");
  return [street, location.neighborhood, location.city, location.departmentName]
    .filter(Boolean)
    .join(", ");
}

function shortTime(time) {
  return time?.slice(0, 5) ?? "--:--";
}

export default function VenueDetailScreen() {
  const { venueId: rawVenueId } = useLocalSearchParams();
  const venueId = Array.isArray(rawVenueId) ? rawVenueId[0] : rawVenueId;
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const [venue, setVenue] = useState(null);
  const [venueImages, setVenueImages] = useState([]);
  const [courts, setCourts] = useState([]);
  const [courtImages, setCourtImages] = useState({});
  const [openingHours, setOpeningHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!venueId) {
      setError("No se pudo identificar el complejo.");
      setLoading(false);
      return;
    }

    let active = true;

    Promise.all([
      venuesApi.publicOne(venueId),
      imagesApi.venueList(venueId),
      courtsApi.list(venueId),
      scheduleApi.hours(venueId),
    ])
      .then(async ([venueData, imageData, courtData, hoursData]) => {
        const activeCourts = courtData.filter((court) => court.active);
        const imageEntries = await Promise.all(
          activeCourts.map(async (court) => {
            const images = await imagesApi.courtList(court.id).catch(() => []);
            return [court.id, images[0]?.url];
          }),
        );

        if (!active) return;
        setVenue(venueData);
        setVenueImages(imageData);
        setCourts(activeCourts);
        setOpeningHours(hoursData);
        setCourtImages(Object.fromEntries(imageEntries));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [venueId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#080B0D]">
        <ActivityIndicator color="#80D160" size="large" />
        <Text className="mt-4 text-[#A9B1B8]">Cargando complejo...</Text>
      </View>
    );
  }

  if (error || !venue) {
    return (
      <View className="flex-1 items-center justify-center bg-[#080B0D] px-6">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-[#231719]">
          <Ionicons name="alert-circle-outline" size={32} color="#F87171" />
        </View>
        <Text className="mt-5 text-center text-xl font-semibold text-white">
          No pudimos cargar el complejo
        </Text>
        <Text className="mt-2 text-center text-[#A9B1B8]">{error}</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 rounded-xl bg-[#80D160] px-6 py-3"
        >
          <Text className="font-semibold text-[#152012]">Volver</Text>
        </Pressable>
      </View>
    );
  }

  const heroImage =
    venueImages.find((image) => image.cover)?.url ??
    venue.coverImageUrl ??
    venueImages[0]?.url;

  return (
    <View className="flex-1 bg-[#080B0D]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom + 28 }}
      >
        <View className="relative h-72 bg-[#18231F]">
          {heroImage ? (
            <Image
              source={{ uri: heroImage }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full items-center justify-center">
              <Ionicons name="image-outline" size={48} color="#69727B" />
              <Text className="mt-3 text-[#8B949E]">
                Sin imagen del complejo
              </Text>
            </View>
          )}
          <View className="absolute bottom-0 left-0 right-0 h-24 bg-black/40" />
          {venueImages.length > 1 && (
            <View className="absolute bottom-4 right-5 flex-row items-center rounded-full bg-black/70 px-3 py-1.5">
              <Ionicons name="images-outline" size={15} color="#FFFFFF" />
              <Text className="ml-1.5 text-xs font-medium text-white">
                {venueImages.length} fotos
              </Text>
            </View>
          )}
        </View>

        <View className="px-5 pt-5">
          <Ionicons
            name="arrow-forward"
            size={18}
            color="#152012"
            style={{ marginLeft: 8 }}
          />
          <View className="flex-row items-start justify-between">
            <View className="mr-4 flex-1">
              <Text className="text-[30px] font-bold tracking-tight text-white">
                {venue.name}
              </Text>
              <View className="mt-2 flex-row items-start">
                <Ionicons name="location-outline" size={18} color="#80D160" />
                <Text className="ml-2 flex-1 leading-5 text-[#A9B1B8]">
                  {buildAddress(venue.location)}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center rounded-full border border-[#315C3B] bg-[#142019] px-3 py-2">
              <View className="mr-2 h-2 w-2 rounded-full bg-[#80D160]" />
              <Text className="text-xs font-semibold text-[#80D160]">
                {venue.status === "ACTIVE" ? "Activo" : venue.status}
              </Text>
            </View>
          </View>

          {!!venue.description && (
            <Text className="mt-5 text-[15px] leading-6 text-[#C5CBD1]">
              {venue.description}
            </Text>
          )}

          {(venue.phone || venue.whatsappPhone) && (
            <View className="mt-5 flex-row gap-3">
              {!!venue.phone && (
                <View className="flex-1 flex-row items-center rounded-xl border border-[#252D31] bg-[#0D1517] px-3 py-3">
                  <Ionicons name="call-outline" size={18} color="#80D160" />
                  <Text
                    numberOfLines={1}
                    className="ml-2 flex-1 text-sm text-[#C5CBD1]"
                  >
                    {venue.phone}
                  </Text>
                </View>
              )}
              {!!venue.whatsappPhone && (
                <View className="flex-1 flex-row items-center rounded-xl border border-[#252D31] bg-[#0D1517] px-3 py-3">
                  <Ionicons name="logo-whatsapp" size={18} color="#80D160" />
                  <Text
                    numberOfLines={1}
                    className="ml-2 flex-1 text-sm text-[#C5CBD1]"
                  >
                    {venue.whatsappPhone}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View className="my-6 h-px bg-[#252D31]" />

          <View className="mb-4 flex-row items-end justify-between">
            <View>
              <Text className="text-xl font-bold text-white">Canchas</Text>
              <Text className="mt-1 text-sm text-[#8B949E]">
                Opciones disponibles en el complejo
              </Text>
            </View>
            <Text className="text-sm font-medium text-[#80D160]">
              {courts.length} {courts.length === 1 ? "cancha" : "canchas"}
            </Text>
          </View>

          {courts.length === 0 ? (
            <View className="rounded-2xl border border-[#252D31] bg-[#0D1517] p-5">
              <Text className="text-center text-[#A9B1B8]">
                No hay canchas activas publicadas.
              </Text>
            </View>
          ) : (
            courts.map((court) => (
              <VenueCourtCard
                key={court.id}
                court={court}
                imageUrl={courtImages[court.id]}
              />
            ))
          )}

          <View className="my-3 h-px bg-[#252D31]" />
          <Text className="mt-3 text-xl font-bold text-white">Horarios</Text>
          <Text className="mb-4 mt-1 text-sm text-[#8B949E]">
            Horarios habituales del complejo
          </Text>

          <View className="overflow-hidden rounded-2xl border border-[#252D31] bg-[#0D1517]">
            {DAYS.map((day, index) => {
              const ranges = openingHours.filter(
                (hour) => Number(hour.dayOfWeek) === index + 1,
              );
              return (
                <View
                  key={day}
                  className={`flex-row items-center justify-between px-4 py-3 ${index < DAYS.length - 1 ? "border-b border-[#252D31]" : ""}`}
                >
                  <Text className="font-medium text-[#C5CBD1]">{day}</Text>
                  <Text
                    className={
                      ranges.length ? "text-[#80D160]" : "text-[#69727B]"
                    }
                  >
                    {ranges.length
                      ? ranges
                          .map(
                            (hour) =>
                              `${shortTime(hour.opensAt)} – ${shortTime(hour.closesAt)}`,
                          )
                          .join(" / ")
                      : "Cerrado"}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <Pressable
        onPress={() => router.back()}
        className="absolute left-4 h-11 w-11 items-center justify-center rounded-full bg-black/75"
        style={{ top: top + 10 }}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
