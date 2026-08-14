import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { reservationsApi } from "../../services/api";

export default function Reservas() {
  const { top } = useSafeAreaInsets();
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const from = new Date();
    const to = new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
    const load = user.role === "PLAYER"
      ? reservationsApi.mine()
      : reservationsApi.ownerAgenda(from.toISOString(), to.toISOString());

    load.then(setReservations).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [user.role]);

  return (
    <View className="flex-1 bg-[#17191C]" style={{ paddingTop: top + 20 }}>
      <View className="px-4 pb-4">
        <Text className="text-3xl font-semibold text-white">{user.role === "PLAYER" ? "Mis reservas" : "Agenda"}</Text>
        <Text className="mt-1 text-sm text-[#A9B1B8]">Próximos 30 días</Text>
      </View>

      {loading ? <ActivityIndicator className="mt-10" color="#80D160" /> : error ? (
        <Text className="px-4 text-red-400">{error}</Text>
      ) : reservations.length === 0 ? (
        <Text className="px-4 text-[#A9B1B8]">Todavía no hay reservas.</Text>
      ) : (
        <ScrollView contentContainerClassName="px-4 pb-8">
          {reservations.map((reservation) => {
            const startsAt = new Date(reservation.startsAt);
            return (
              <View className="mb-3 rounded-2xl border border-[#30363D] bg-[#202428] p-4" key={reservation.id}>
                <Text className="text-lg font-semibold text-white">Cancha {reservation.courtId.slice(0, 8)}</Text>
                <Text className="mt-2 text-[#C5CBD1]">
                  {startsAt.toLocaleDateString("es-UY")} · {startsAt.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" })}
                </Text>
                <Text className="mt-2 text-sm text-[#80D160]">{reservation.status} · {reservation.paymentStatus}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
