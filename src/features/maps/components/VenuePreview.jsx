import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatUruguayCalendarDate } from "../../../utils/uruguayDateTime";

function dateLabel(value) {
  return formatUruguayCalendarDate(value, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function VenuePreview({
  venue,
  availability,
  availabilityLoading,
  availabilityError,
  selectedDate,
  selectedTime,
  onClose,
}) {
  const { bottom } = useSafeAreaInsets();
  const availableCourts = availability?.availableCourts ?? [];
  const firstAvailableCourt = availableCourts[0];
  const status = availabilityError
    ? {
        color: "#D6A84B",
        background: "#2D281B",
        text: "No se pudo confirmar",
      }
    : availabilityLoading
      ? {
          color: "#A9B1B8",
          background: "#292D32",
          text: "Consultando...",
        }
      : availability?.available
        ? {
            color: "#80D160",
            background: "#142019",
            text: `${availableCourts.length} ${availableCourts.length === 1 ? "cancha libre" : "canchas libres"}`,
          }
        : {
            color: "#A9B1B8",
            background: "#292D32",
            text: "Sin disponibilidad",
          };

  return (
    <View
      className="absolute left-4 right-4 overflow-hidden rounded-3xl border border-[#30363D] bg-[#202428] p-4"
      style={{ bottom: Math.max(bottom, 10) + 66 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar detalle del complejo"
        onPress={onClose}
        className="absolute right-3 top-3 z-10 h-9 w-9 items-center justify-center rounded-xl border border-[#3B4249] bg-[#17191C]"
      >
        <Ionicons name="close" size={21} color="#FFFFFF" />
      </Pressable>

      <View className="flex-row pr-10">
        {venue.coverImageUrl ? (
          <Image
            source={{ uri: venue.coverImageUrl }}
            className="mr-3 h-20 w-20 rounded-2xl"
            resizeMode="cover"
          />
        ) : (
          <View className="mr-3 h-20 w-20 items-center justify-center rounded-2xl bg-[#18231F]">
            <Ionicons name="business-outline" size={28} color="#69727B" />
          </View>
        )}
        <View className="flex-1">
          <Text numberOfLines={1} className="text-lg font-bold text-white">
            {venue.name}
          </Text>
          <Text className="mt-1 text-xs capitalize text-[#A9B1B8]">
            {dateLabel(selectedDate)} · {selectedTime} a{" "}
            {selectedTime.slice(0, 2)}:59
          </Text>
          <View
            className="mt-2 self-start rounded-full px-3 py-1.5"
            style={{ backgroundColor: status.background }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: status.color }}
            >
              {status.text}
            </Text>
          </View>
        </View>
      </View>

      {!availabilityLoading && !availabilityError && (
        <View className="mt-3 rounded-xl bg-[#17191C] px-3 py-2.5">
          {availableCourts.length > 0 ? (
            <Text
              numberOfLines={2}
              className="text-xs leading-5 text-[#C5CBD1]"
            >
              Disponibles:{" "}
              {availableCourts.map((court) => court.courtName).join(", ")}
            </Text>
          ) : (
            <Text className="text-xs leading-5 text-[#8B949E]">
              Ninguna cancha tiene un turno que comience en esa franja.
            </Text>
          )}
        </View>
      )}

      <Link
        href={{
          pathname: "/venueLayout",
          params: {
            venueId: venue.id,
            date: selectedDate,
            time: firstAvailableCourt?.matchingTime ?? selectedTime,
            ...(firstAvailableCourt
              ? { courtId: firstAvailableCourt.courtId }
              : {}),
          },
        }}
        asChild
      >
        <Pressable className="mt-3 flex-row items-center justify-center rounded-xl bg-[#80D160] py-3.5">
          <Text className="font-semibold text-[#152012]">Ver turnos</Text>
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
