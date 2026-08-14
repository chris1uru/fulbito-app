import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BookingCard from "../../components/BookingCard";

const bookings = [
  {
    id: "1",
    name: "Complejo La Redonda",
    date: "Jueves 13 de agosto",
    time: "20:00",
    remainingTime: "10:24",
    address: "Av. Italia 2450, Malvín",
    phone: "099 123 456",
  },
  {
    id: "2",
    name: "Cancha Parque Rodó",
    date: "Sábado 15 de agosto",
    time: "18:00",
    remainingTime: "2 días",
    address: "Bv. España 2750, Parque Rodó",
    phone: "098 456 789",
  },
];

export default function Reservas() {
  const { top } = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#17191C]" style={{ paddingTop: top + 20 }}>
      <View className="px-4 pb-4">
        <Text className="text-3xl font-semibold text-white">Mis reservas</Text>
        <Text className="mt-1 text-sm text-[#A9B1B8]">
          Tus próximos partidos
        </Text>
      </View>

      <ScrollView contentContainerClassName="px-4 pb-8">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </ScrollView>
    </View>
  );
}
