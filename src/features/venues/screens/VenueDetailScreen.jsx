import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAlert as Alert } from "../../../components/common/AppAlert";
import { useAuth } from "../../../providers/AuthProvider";
import {
  courtsApi,
  imagesApi,
  reservationsApi,
  scheduleApi,
  venuesApi,
} from "../../../services/api";
import {
  addUruguayDays,
  formatUruguayCalendarDate,
  formatUruguayTime,
  uruguayDateKey,
} from "../../../utils/uruguayDateTime";
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

function single(value) {
  return Array.isArray(value) ? value[0] : value;
}

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

function dateKey(date) {
  return uruguayDateKey(date);
}

function validDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && dateKey(parsed) === value;
}

function dateLabel(value) {
  return formatUruguayCalendarDate(value, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function slotTime(value) {
  return formatUruguayTime(value);
}

function slotTimeKey(value) {
  return value?.split("T")[1]?.slice(0, 5) ?? "";
}

export default function VenueDetailScreen() {
  const params = useLocalSearchParams();
  const venueId = single(params.venueId);
  const requestedDate = single(params.date);
  const requestedTime = single(params.time);
  const requestedCourtId = single(params.courtId);
  const router = useRouter();
  const { user } = useAuth();
  const { top, bottom } = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const courtCarouselRef = useRef(null);
  const today = dateKey(new Date());
  const initialDate =
    validDateKey(requestedDate) && requestedDate >= today
      ? requestedDate
      : today;
  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) =>
      addUruguayDays(initialDate, index),
    );
  }, [initialDate]);
  const [venue, setVenue] = useState(null);
  const [venueImages, setVenueImages] = useState([]);
  const [courts, setCourts] = useState([]);
  const [courtImages, setCourtImages] = useState({});
  const [openingHours, setOpeningHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCourtId, setSelectedCourtId] = useState("");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [bookingSlot, setBookingSlot] = useState("");
  const courtCardWidth = Math.max(
    260,
    screenWidth - (courts.length === 1 ? 40 : 64),
  );
  const courtSnapInterval = courtCardWidth + 12;

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
      .then(([venueData, imageData, courtData, hoursData]) => {
        const activeCourts = courtData.filter((court) => court.active);
        const imageEntries = activeCourts.map((court) => [
          court.id,
          court.coverImageUrl,
        ]);

        if (!active) return;
        setVenue(venueData);
        setVenueImages(imageData);
        setCourts(activeCourts);
        setSelectedCourtId(
          activeCourts.some((court) => court.id === requestedCourtId)
            ? requestedCourtId
            : activeCourts[0]?.id || "",
        );
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
  }, [requestedCourtId, venueId]);

  useEffect(() => {
    setSelectedDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    const initialCourtId = courts.some((court) => court.id === requestedCourtId)
      ? requestedCourtId
      : courts[0]?.id;
    const selectedIndex = courts.findIndex(
      (court) => court.id === initialCourtId,
    );
    if (selectedIndex < 0) return;

    courtCarouselRef.current?.scrollTo({
      x: selectedIndex * courtSnapInterval,
      animated: false,
    });
  }, [courtSnapInterval, courts, requestedCourtId]);

  useEffect(() => {
    if (!selectedCourtId || !selectedDate) {
      setAvailability(null);
      return;
    }
    let active = true;
    setAvailabilityError("");
    setAvailabilityLoading(true);
    courtsApi
      .availability(selectedCourtId, selectedDate)
      .then((data) => {
        if (active) setAvailability(data);
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
  }, [selectedCourtId, selectedDate]);

  function reserve(slot) {
    if (!slot.available) return;
    if (user.role !== "PLAYER") {
      Alert.alert(
        "Vista de disponibilidad",
        "Las reservas manuales de dueño o administrador se cargan desde la agenda.",
      );
      return;
    }
    const court = courts.find((item) => item.id === selectedCourtId);
    Alert.alert(
      "Confirmar reserva",
      `${court?.name}\n${dateLabel(selectedDate)} a las ${slotTime(slot.startsAt)}\n$ ${Number(court?.pricePerSlot).toLocaleString("es-UY")}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reservar",
          onPress: async () => {
            try {
              setBookingSlot(slot.startsAt);
              await reservationsApi.create({
                courtId: selectedCourtId,
                startsAt: slot.startsAt,
                endsAt: slot.endsAt,
                playerName: null,
                playerPhone: null,
                notes: null,
              });
              setAvailability((current) => ({
                ...current,
                slots: current.slots.map((item) =>
                  item.startsAt === slot.startsAt
                    ? { ...item, available: false }
                    : item,
                ),
              }));
              Alert.alert(
                "Reserva confirmada",
                "El turno ya aparece en tu agenda.",
              );
            } catch (requestError) {
              Alert.alert("No se pudo reservar", requestError.message);
            } finally {
              setBookingSlot("");
            }
          },
        },
      ],
    );
  }

  function selectCourtAt(index, animated = true) {
    const safeIndex = Math.max(0, Math.min(index, courts.length - 1));
    const court = courts[safeIndex];
    if (!court) return;

    setSelectedCourtId(court.id);
    courtCarouselRef.current?.scrollTo({
      x: safeIndex * courtSnapInterval,
      animated,
    });
  }

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
            <>
              <ScrollView
                ref={courtCarouselRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                disableIntervalMomentum
                snapToAlignment="start"
                snapToInterval={courtSnapInterval}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingRight: 24 }}
                onScroll={(event) => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x / courtSnapInterval,
                  );
                  const visibleCourt = courts[index];
                  if (visibleCourt && visibleCourt.id !== selectedCourtId) {
                    setSelectedCourtId(visibleCourt.id);
                  }
                }}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x / courtSnapInterval,
                  );
                  selectCourtAt(index, false);
                }}
              >
                {courts.map((court, index) => (
                  <View
                    key={court.id}
                    style={{
                      width: courtCardWidth,
                      marginRight: index === courts.length - 1 ? 0 : 12,
                    }}
                  >
                    <VenueCourtCard
                      court={court}
                      imageUrl={courtImages[court.id]}
                      selected={court.id === selectedCourtId}
                      onPress={() => selectCourtAt(index)}
                    />
                  </View>
                ))}
              </ScrollView>

              {courts.length > 1 && (
                <View className="mb-4 flex-row items-center self-center rounded-full border border-[#252D31] bg-[#0D1517] px-3 py-2">
                  {courts.map((court, index) => (
                    <Pressable
                      key={court.id}
                      onPress={() => selectCourtAt(index)}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver ${court.name}`}
                      className={`h-2 w-2 rounded-full ${
                        index > 0 ? "ml-2" : ""
                      } ${
                        court.id === selectedCourtId
                          ? "bg-[#80D160]"
                          : "bg-[#3B4249]"
                      }`}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {courts.length > 0 && (
            <>
              <View className="my-3 h-px bg-[#252D31]" />
              <Text className="mt-3 text-xl font-bold text-white">
                Disponibilidad
              </Text>
              <Text className="mb-4 mt-1 text-sm text-[#8B949E]">
                Elegí una cancha, una fecha y un turno libre.
              </Text>

              {!!requestedTime && selectedDate === initialDate && (
                <View className="mb-4 flex-row items-center rounded-xl border border-[#315C3B] bg-[#142019] px-3 py-2.5">
                  <Ionicons name="locate-outline" size={17} color="#80D160" />
                  <Text className="ml-2 flex-1 text-xs text-[#C5CBD1]">
                    Búsqueda del mapa: {dateLabel(initialDate)} a las{" "}
                    {requestedTime}
                  </Text>
                </View>
              )}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                {dates.map((date) => (
                  <Pressable
                    key={date}
                    onPress={() => setSelectedDate(date)}
                    className={`mr-2 rounded-xl border px-4 py-3 ${
                      selectedDate === date
                        ? "border-[#80D160] bg-[#2C4930]"
                        : "border-[#252D31] bg-[#0D1517]"
                    }`}
                  >
                    <Text
                      className={`font-semibold capitalize ${
                        selectedDate === date
                          ? "text-[#80D160]"
                          : "text-[#A9B1B8]"
                      }`}
                    >
                      {dateLabel(date)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View className="rounded-2xl border border-[#252D31] bg-[#0D1517] p-4">
                {availabilityLoading ? (
                  <View className="items-center py-5">
                    <ActivityIndicator color="#80D160" />
                    <Text className="mt-2 text-sm text-[#8B949E]">
                      Consultando turnos reales...
                    </Text>
                  </View>
                ) : availabilityError ? (
                  <View className="items-center py-4">
                    <Ionicons
                      name="alert-circle-outline"
                      size={26}
                      color="#F08A93"
                    />
                    <Text className="mt-2 text-center text-sm text-[#F08A93]">
                      {availabilityError}
                    </Text>
                  </View>
                ) : !availability?.slots?.length ? (
                  <Text className="text-center text-[#8B949E]">
                    No hay turnos configurados para esta fecha.
                  </Text>
                ) : (
                  <View className="flex-row flex-wrap">
                    {availability.slots.map((slot) => {
                      const requestedFromMap =
                        selectedDate === initialDate &&
                        requestedTime === slotTimeKey(slot.startsAt);
                      return (
                        <Pressable
                          key={slot.startsAt}
                          disabled={!slot.available || !!bookingSlot}
                          onPress={() => reserve(slot)}
                          className={`mb-2 mr-2 min-w-[88px] items-center rounded-xl border px-3 py-3 ${
                            requestedFromMap && slot.available
                              ? "border-[#80D160] bg-[#2C4930]"
                              : slot.available
                                ? "border-[#315C3B] bg-[#142019]"
                                : "border-[#252D31] bg-[#202428]"
                          }`}
                        >
                          <Text
                            className={`font-bold ${
                              slot.available
                                ? "text-[#80D160]"
                                : "text-[#69727B] line-through"
                            }`}
                          >
                            {slotTime(slot.startsAt)}
                          </Text>
                          <Text className="mt-1 text-[10px] text-[#8B949E]">
                            {bookingSlot === slot.startsAt
                              ? "Reservando..."
                              : requestedFromMap && slot.available
                                ? "Buscado"
                                : slot.available
                                  ? "Disponible"
                                  : "Ocupado"}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
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
