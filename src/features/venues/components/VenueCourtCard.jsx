import { Ionicons } from "@expo/vector-icons";
import { Image, Text, View } from "react-native";

const SURFACES = {
  SYNTHETIC_GRASS: "Césped sintético",
  NATURAL_GRASS: "Césped natural",
  INDOOR: "Interior",
  CONCRETE: "Hormigón",
  OTHER: "Otra superficie",
};

const FORMATS = {
  FIVE: "Fútbol 5",
  SEVEN: "Fútbol 7",
  ELEVEN: "Fútbol 11",
};

function formatPrice(value, currency) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Precio a consultar";
  return `${currency === "UYU" ? "$" : `${currency} `}${amount.toLocaleString("es-UY")}`;
}

export default function VenueCourtCard({ court, imageUrl }) {
  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-[#264B36] bg-[#0D1517]">
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="h-36 w-full"
          resizeMode="cover"
        />
      ) : (
        <View className="h-28 items-center justify-center bg-[#18231F]">
          <Ionicons name="football-outline" size={34} color="#69727B" />
        </View>
      )}

      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="mr-3 flex-1">
            <Text className="text-lg font-bold text-white">{court.name}</Text>
            <Text className="mt-1 text-sm text-[#A9B1B8]">
              {SURFACES[court.surface] ?? court.surface} ·{" "}
              {FORMATS[court.footballFormat] ?? court.footballFormat}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-lg font-bold text-[#80D160]">
              {formatPrice(court.pricePerSlot, court.currency)}
            </Text>
            <Text className="text-xs text-[#8B949E]">por turno</Text>
          </View>
        </View>

        <View className="mt-4 flex-row gap-2">
          <View className="flex-row items-center rounded-lg bg-[#18231F] px-3 py-2">
            <Ionicons name="time-outline" size={15} color="#A9B1B8" />
            <Text className="ml-1.5 text-xs text-[#C5CBD1]">
              {court.slotMinutes} min
            </Text>
          </View>
          <View className="flex-row items-center rounded-lg bg-[#18231F] px-3 py-2">
            <Ionicons
              name={court.covered ? "home-outline" : "sunny-outline"}
              size={15}
              color="#A9B1B8"
            />
            <Text className="ml-1.5 text-xs text-[#C5CBD1]">
              {court.covered ? "Techada" : "Al aire libre"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
