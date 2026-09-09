import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
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

function callablePhone(value) {
  return String(value ?? "").replace(/[^+\d]/g, "");
}

function whatsappPhone(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function SectionHeading({ icon, title, subtitle, trailing }) {
  return (
    <View className="mb-4 flex-row items-center">
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-[#2C4930]">
        <Ionicons name={icon} size={22} color="#80D160" />
      </View>
      <View className="flex-1">
        <Text className="text-xl font-bold text-white">{title}</Text>
        {!!subtitle && (
          <Text className="mt-0.5 text-sm text-[#8B949E]">{subtitle}</Text>
        )}
      </View>
      {trailing}
    </View>
  );
}

function VenueGallery({ visible, images, initialIndex, onClose }) {
  const { top, bottom } = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) setActiveIndex(initialIndex);
  }, [initialIndex, visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        <FlatList
          key={`${visible}-${initialIndex}`}
          data={images}
          horizontal
          pagingEnabled
          initialScrollIndex={initialIndex}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onMomentumScrollEnd={(event) => {
            setActiveIndex(
              Math.round(event.nativeEvent.contentOffset.x / width),
            );
          }}
          renderItem={({ item }) => (
            <View
              className="items-center justify-center"
              style={{ width, height }}
            >
              <Image
                source={{ uri: item }}
                resizeMode="contain"
                style={{ width, height: height - top - bottom - 80 }}
              />
            </View>
          )}
        />

        <View
          className="absolute left-4 right-4 flex-row items-center justify-between"
          style={{ top: top + 10 }}
        >
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar galería"
            className="h-11 w-11 items-center justify-center rounded-xl border border-white/10"
            style={{ backgroundColor: "rgba(23, 25, 28, 0.88)" }}
          >
            <Ionicons name="close" size={25} color="#FFFFFF" />
          </Pressable>
          <View
            className="rounded-full px-3 py-2"
            style={{ backgroundColor: "rgba(23, 25, 28, 0.88)" }}
          >
            <Text className="font-semibold text-white">
              {activeIndex + 1} / {images.length}
            </Text>
          </View>
        </View>

        {images.length > 1 && (
          <View
            className="absolute left-0 right-0 flex-row items-center justify-center"
            style={{ bottom: bottom + 22 }}
          >
            {images.map((image, index) => (
              <View
                key={image}
                className={`h-2 rounded-full ${index > 0 ? "ml-2" : ""} ${
                  index === activeIndex ? "w-6 bg-[#80D160]" : "w-2 bg-white/40"
                }`}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
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
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [activeGalleryImages, setActiveGalleryImages] = useState([]);
  const [courtGalleryImages, setCourtGalleryImages] = useState({});
  const [courtGalleryLoadingId, setCourtGalleryLoadingId] = useState("");
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

  async function openContact(url, label) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        `No se pudo abrir ${label}`,
        "Revisá que el dispositivo tenga una aplicación compatible.",
      );
    }
  }

  function callVenue() {
    const phone = callablePhone(venue?.phone);
    if (phone) openContact(`tel:${phone}`, "la llamada");
  }

  function messageVenue() {
    const phone = whatsappPhone(venue?.whatsappPhone);
    if (phone) openContact(`https://wa.me/${phone}`, "WhatsApp");
  }

  async function openCourtGallery(court) {
    let images = courtGalleryImages[court.id];
    if (!images) {
      setCourtGalleryLoadingId(court.id);
      try {
        const imageData = await imagesApi.courtList(court.id);
        images = [
          ...new Set(
            [
              court.coverImageUrl,
              ...imageData.map((image) => image.url),
            ].filter(Boolean),
          ),
        ];
        setCourtGalleryImages((current) => ({
          ...current,
          [court.id]: images,
        }));
      } catch (requestError) {
        Alert.alert("No se pudieron cargar las fotos", requestError.message);
        return;
      } finally {
        setCourtGalleryLoadingId("");
      }
    }

    if (!images.length) {
      Alert.alert(
        "Sin fotos",
        "El complejo todavía no publicó imágenes de esta cancha.",
      );
      return;
    }
    setActiveGalleryImages(images);
    setGalleryInitialIndex(0);
    setGalleryVisible(true);
  }

  function showDirections() {
    const location = venue?.location;
    if (!location) {
      Alert.alert(
        "Ubicación no disponible",
        "El complejo todavía no informó su ubicación.",
      );
      return;
    }

    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);
    const hasCoordinates =
      Number.isFinite(latitude) && Number.isFinite(longitude);
    const destination = hasCoordinates
      ? `${latitude},${longitude}`
      : buildAddress(location);
    const encodedDestination = encodeURIComponent(destination);
    const encodedName = encodeURIComponent(venue.name);
    const systemMapsUrl =
      Platform.OS === "ios"
        ? `https://maps.apple.com/?daddr=${encodedDestination}&dirflg=d`
        : Platform.OS === "android"
          ? `geo:0,0?q=${encodedDestination}(${encodedName})`
          : `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}`;

    Alert.alert("Cómo llegar", buildAddress(location), [
      {
        text: "Google Maps",
        onPress: () =>
          openContact(
            `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}`,
            "Google Maps",
          ),
      },
      {
        text: "Waze",
        onPress: () =>
          openContact(
            hasCoordinates
              ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
              : `https://waze.com/ul?q=${encodedDestination}&navigate=yes`,
            "Waze",
          ),
      },
      {
        text: Platform.OS === "ios" ? "Mapas" : "App de mapas",
        onPress: () => openContact(systemMapsUrl, "la aplicación de mapas"),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#17191C]">
        <ActivityIndicator color="#80D160" size="large" />
        <Text className="mt-4 text-[#A9B1B8]">Cargando complejo...</Text>
      </View>
    );
  }

  if (error || !venue) {
    return (
      <View className="flex-1 items-center justify-center bg-[#17191C] px-6">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#3A292D]">
          <Ionicons name="alert-circle-outline" size={32} color="#F08A93" />
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
  const venueGalleryImages = [
    ...new Set(
      [heroImage, ...venueImages.map((image) => image.url)].filter(Boolean),
    ),
  ];

  return (
    <View className="flex-1 bg-[#17191C]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom + 28 }}
      >
        <Pressable
          disabled={!heroImage}
          onPress={() => {
            setActiveGalleryImages(venueGalleryImages);
            setGalleryInitialIndex(0);
            setGalleryVisible(true);
          }}
          accessibilityRole={heroImage ? "button" : undefined}
          accessibilityLabel={heroImage ? "Ver fotos del complejo" : undefined}
          className="relative h-64 bg-[#292D32]"
        >
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
          <View className="absolute bottom-0 left-0 right-0 h-32 bg-black/40" />
          {venueGalleryImages.length > 0 && (
            <View
              className="absolute bottom-10 right-4 flex-row items-center rounded-full px-3 py-1.5"
              style={{ backgroundColor: "rgba(23, 25, 28, 0.88)" }}
            >
              <Ionicons name="images-outline" size={15} color="#FFFFFF" />
              <Text className="ml-1.5 text-xs font-medium text-white">
                {venueGalleryImages.length}{" "}
                {venueGalleryImages.length === 1 ? "foto" : "fotos"} · Ver
              </Text>
            </View>
          )}
        </Pressable>

        <View className="px-4" style={{ marginTop: -28 }}>
          <View className="rounded-3xl border border-[#30363D] bg-[#202428] p-5">
            <View className="flex-row items-start justify-between">
              <View className="mr-4 flex-1">
                <Text className="text-[30px] font-bold tracking-tight text-white">
                  {venue.name}
                </Text>
                <Pressable
                  onPress={showDirections}
                  accessibilityRole="button"
                  accessibilityLabel={`Cómo llegar a ${venue.name}`}
                  className="mt-2 flex-row items-center rounded-xl bg-[#292D32] px-3 py-3"
                >
                  <Ionicons name="location-outline" size={18} color="#80D160" />
                  <Text className="ml-2 flex-1 leading-5 text-[#A9B1B8]">
                    {buildAddress(venue.location)}
                  </Text>
                  <View className="ml-2 h-8 w-8 items-center justify-center rounded-lg bg-[#2C4930]">
                    <Ionicons
                      name="navigate-outline"
                      size={17}
                      color="#80D160"
                    />
                  </View>
                </Pressable>
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
                  <Pressable
                    onPress={callVenue}
                    accessibilityRole="button"
                    accessibilityLabel={`Llamar a ${venue.name}`}
                    className="min-h-12 flex-1 flex-row items-center justify-center rounded-xl border border-[#30363D] bg-[#292D32] px-3"
                  >
                    <Ionicons name="call-outline" size={19} color="#80D160" />
                    <View className="ml-2 flex-shrink">
                      <Text className="font-semibold text-white">Llamar</Text>
                      <Text
                        numberOfLines={1}
                        className="text-xs text-[#8B949E]"
                      >
                        {venue.phone}
                      </Text>
                    </View>
                  </Pressable>
                )}
                {!!venue.whatsappPhone && (
                  <Pressable
                    onPress={messageVenue}
                    accessibilityRole="button"
                    accessibilityLabel={`Escribir por WhatsApp a ${venue.name}`}
                    className="min-h-12 flex-1 flex-row items-center justify-center rounded-xl bg-[#2C4930] px-3"
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="#80D160" />
                    <View className="ml-2 flex-shrink">
                      <Text className="font-semibold text-[#80D160]">
                        WhatsApp
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="text-xs text-[#A9B1B8]"
                      >
                        {venue.whatsappPhone}
                      </Text>
                    </View>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          <View className="h-6" />

          <SectionHeading
            icon="football-outline"
            title="Canchas"
            subtitle="Opciones disponibles en el complejo"
            trailing={
              <View className="rounded-full bg-[#2C4930] px-3 py-1.5">
                <Text className="text-xs font-semibold text-[#80D160]">
                  {courts.length} {courts.length === 1 ? "cancha" : "canchas"}
                </Text>
              </View>
            }
          />

          {courts.length === 0 ? (
            <View className="rounded-2xl border border-[#30363D] bg-[#202428] p-5">
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
                      onImagePress={() => openCourtGallery(court)}
                      imageCount={courtGalleryImages[court.id]?.length}
                      imageLoading={courtGalleryLoadingId === court.id}
                    />
                  </View>
                ))}
              </ScrollView>

              {courts.length > 1 && (
                <View className="mb-4 flex-row items-center self-center rounded-full border border-[#30363D] bg-[#202428] px-3 py-2">
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
              <View className="h-4" />
              <SectionHeading
                icon="calendar-outline"
                title="Disponibilidad"
                subtitle="Elegí una cancha, una fecha y un turno libre"
              />

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
                        : "border-[#30363D] bg-[#202428]"
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

              <View className="rounded-2xl border border-[#30363D] bg-[#202428] p-4">
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
                                : "border-[#30363D] bg-[#292D32]"
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

          <View className="h-7" />
          <SectionHeading
            icon="time-outline"
            title="Horarios"
            subtitle="Horarios habituales del complejo"
          />

          <View className="overflow-hidden rounded-2xl border border-[#30363D] bg-[#202428]">
            {DAYS.map((day, index) => {
              const ranges = openingHours.filter(
                (hour) => Number(hour.dayOfWeek) === index + 1,
              );
              return (
                <View
                  key={day}
                  className={`flex-row items-center justify-between px-4 py-3.5 ${index < DAYS.length - 1 ? "border-b border-[#30363D]" : ""}`}
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
        className="absolute left-4 h-11 w-11 items-center justify-center rounded-xl border border-white/10"
        style={{ top: top + 10, backgroundColor: "rgba(23, 25, 28, 0.9)" }}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </Pressable>

      {activeGalleryImages.length > 0 && (
        <VenueGallery
          visible={galleryVisible}
          images={activeGalleryImages}
          initialIndex={galleryInitialIndex}
          onClose={() => setGalleryVisible(false)}
        />
      )}
    </View>
  );
}
