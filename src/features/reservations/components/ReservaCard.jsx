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

export default function ReservaCard({ reservation, imageUrl }) {
  const startsAt = new Date(reservation.startsAt);
  const isCancelled = reservation.status?.startsWith("CANCELLED");
  const accentColor = isCancelled ? "#F87171" : "#80D160";

  return (
    <View className="mb-5 overflow-hidden rounded-2xl border border-[#264B36] bg-[#0D1517]">
      <View className="flex-row">
        <View className="w-[42%] bg-[#18231F]">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              className="h-full min-h-56 w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="min-h-56 flex-1 items-center justify-center px-3">
              <Ionicons name="image-outline" size={34} color="#69727B" />
              <Text className="mt-2 text-center text-xs text-[#8B949E]">
                Imagen de cancha
              </Text>
            </View>
          )}
        </View>

        <View className="flex-1 px-4 py-4">
          <Text numberOfLines={1} className="text-xl font-bold text-white">
            {reservation.venueName}
          </Text>

          <View className="mt-2 flex-row items-center">
            <Ionicons name="football-outline" size={17} color="#80D160" />
            <Text
              numberOfLines={1}
              className="ml-2 flex-1 font-medium text-[#80D160]"
            >
              {reservation.courtName}
            </Text>
          </View>

          <View className="mt-2 flex-row items-center">
            <Ionicons name="calendar-outline" size={17} color="#A9B1B8" />
            <Text className="ml-2 flex-1 text-sm text-[#A9B1B8]">
              {startsAt.toLocaleDateString("es-UY")} ·{" "}
              {startsAt.toLocaleTimeString("es-UY", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          <View className="my-3 h-px bg-[#252D31]" />

          <View className="flex-row items-center">
            <Ionicons
              name={
                isCancelled
                  ? "close-circle-outline"
                  : "checkmark-circle-outline"
              }
              size={17}
              color={accentColor}
            />
            <Text
              className="ml-2 flex-1 text-sm font-medium"
              style={{ color: accentColor }}
            >
              {RESERVATION_STATUS[reservation.status] ?? reservation.status}
            </Text>
          </View>

          <View className="mt-2 flex-row items-center">
            <Ionicons name="card-outline" size={17} color="#A9B1B8" />
            <Text className="ml-2 flex-1 text-sm text-[#C5CBD1]">
              {PAYMENT_STATUS[reservation.paymentStatus] ??
                reservation.paymentStatus}
            </Text>
          </View>

          <Link
            href={{
              pathname: "/venueLayout",
              params: { venueId: reservation.venueId },
            }}
            asChild
          >
            <Pressable className=" mt-3 flex-row items-center justify-center rounded-lg bg-[#80D160] py-3">
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
    </View>
  );
}
