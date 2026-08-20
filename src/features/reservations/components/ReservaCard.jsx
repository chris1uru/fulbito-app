import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";

const RESERVATION_STATUS = {
  CONFIRMED: "Confirmada",
  CANCELLED_BY_OWNER: "Cancelada por el complejo",
  CANCELLED_BY_PLAYER: "Cancelada",
  COMPLETED: "Finalizada",
};

const PAYMENT_STATUS = {
  PENDING: "Pendiente",
  PAID: "Pago",
  REFUNDED: "Reembolsado",
};

export default function ReservaCard({
  reservation,
  imageUrl,
  variant = "featured",
  isPast = false,
}) {
  const startsAt = new Date(reservation.startsAt);
  const isCancelled = reservation.status?.startsWith("CANCELLED");
  const accentColor = isCancelled ? "#F87171" : "#80D160";

  if (variant === "compact") {
    return (
      <Link
        href={{
          pathname: "/reservaDetail",
          params: { reservationId: reservation.id },
        }}
        asChild
      >
        <Pressable
          className={`mb-3 flex-row overflow-hidden rounded-2xl border ${
            isPast
              ? "border-[#30363D] bg-[#1B1E21]"
              : "border-[#315C3B] bg-[#202428]"
          }`}
        >
          <View
            className={`h-24 w-24 bg-[#18231F] ${isPast ? "opacity-60" : ""}`}
          >
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons
                  name="image-outline"
                  size={23}
                  color={isPast ? "#69727B" : "#80D160"}
                />
              </View>
            )}
          </View>

          <View className="flex-1 justify-center px-3 py-2.5">
            <View className="flex-row items-center">
              <Text
                numberOfLines={1}
                className={`mr-2 flex-1 font-semibold ${
                  isPast ? "text-[#A9B1B8]" : "text-white"
                }`}
              >
                {reservation.venueName}
              </Text>
              <View
                className={`h-2 w-2 rounded-full ${
                  isCancelled
                    ? "bg-[#F87171]"
                    : isPast
                      ? "bg-[#69727B]"
                      : "bg-[#80D160]"
                }`}
              />
            </View>

            <Text
              numberOfLines={1}
              className={`mt-1 text-xs ${
                isPast ? "text-[#69727B]" : "text-[#A9B1B8]"
              }`}
            >
              {reservation.courtName}
            </Text>

            <View className="mt-2 flex-row items-center">
              <Ionicons
                name="calendar-outline"
                size={14}
                color={isPast ? "#69727B" : "#80D160"}
              />
              <Text
                className={`ml-1.5 text-xs font-medium ${
                  isPast ? "text-[#8B949E]" : "text-[#C5CBD1]"
                }`}
              >
                {startsAt.toLocaleDateString("es-UY")} ·{" "}
                {startsAt.toLocaleTimeString("es-UY", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>

          <View className="items-center justify-center pr-3">
            <Ionicons name="chevron-forward" size={19} color="#69727B" />
          </View>
        </Pressable>
      </Link>
    );
  }

  return (
    <View className="mb-4 overflow-hidden rounded-3xl border border-[#30363D] bg-[#202428]">
      <View className="bg-[#18231F]">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            className="h-40 w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-36 items-center justify-center">
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
        <View className="flex-row items-start justify-between">
          <View className="mr-3 flex-1">
            <Text numberOfLines={1} className="text-xl font-bold text-white">
              {reservation.venueName}
            </Text>

            <View className="mt-2 flex-row items-center">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-[#2C4930]">
                <Ionicons name="football-outline" size={17} color="#80D160" />
              </View>
              <Text
                numberOfLines={1}
                className="ml-2 flex-1 font-medium text-[#C5CBD1]"
              >
                {reservation.courtName}
              </Text>
            </View>
          </View>

          <View
            className={`rounded-full px-3 py-1.5 ${
              isCancelled ? "bg-[#3A292D]" : "bg-[#2C4930]"
            }`}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: accentColor }}
            >
              {RESERVATION_STATUS[reservation.status] ?? reservation.status}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row rounded-xl border border-[#30363D] bg-[#292D32] p-3">
          <View className="mr-3 h-9 w-9 items-center justify-center rounded-lg bg-[#202428]">
            <Ionicons name="calendar-outline" size={18} color="#80D160" />
          </View>
          <View className="flex-1 justify-center">
            <Text className="text-xs text-[#8B949E]">Fecha y hora</Text>
            <Text className="mt-0.5 text-sm font-medium text-white">
              {startsAt.toLocaleDateString("es-UY")} ·{" "}
              {startsAt.toLocaleTimeString("es-UY", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-center justify-between border-t border-[#30363D] pt-3">
          <View className="flex-row items-center">
            <View className="mr-2 h-8 w-8 items-center justify-center rounded-lg bg-[#292D32]">
              <Ionicons name="card-outline" size={17} color="#A9B1B8" />
            </View>
            <View>
              <Text className="text-xs text-[#8B949E]">Pago</Text>
              <Text className="text-sm font-medium text-[#C5CBD1]">
                {PAYMENT_STATUS[reservation.paymentStatus] ??
                  reservation.paymentStatus}
              </Text>
            </View>
          </View>

          <View className="h-8 w-8 items-center justify-center rounded-lg bg-[#292D32]">
            <Ionicons
              name={
                isCancelled
                  ? "close-circle-outline"
                  : "checkmark-circle-outline"
              }
              size={18}
              color={accentColor}
            />
          </View>
        </View>

        <Link
          href={{
            pathname: "/reservaDetail",
            params: { reservationId: reservation.id },
          }}
          asChild
        >
          <Pressable className="mt-4 flex-row items-center justify-center rounded-xl bg-[#80D160] py-3.5">
            <Text className="font-semibold text-[#152012]">Ver Reserva</Text>
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
