import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useAuth } from "../../../providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import { imagesApi, reservationsApi } from "../../../services/api";
import AppHeader from "../../../components/common/AppHeader";
import ReservaCard from "../components/ReservaCard";

export default function ReservationsScreen() {
  const { user } = useAuth();

  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [courtImages, setCourtImages] = useState({});

  useEffect(() => {
    const from = new Date();
    const to = new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
    const load =
      user.role === "PLAYER"
        ? reservationsApi.mine()
        : reservationsApi.ownerAgenda(from.toISOString(), to.toISOString());

    load
      .then(async (data) => {
        setReservations(data);

        const results = await Promise.all(
          data.map(async (reservation) => {
            const images = await imagesApi.courtList(reservation.courtId);
            return [reservation.courtId, images[0]?.url];
          }),
        );

        setCourtImages(Object.fromEntries(results));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user.role]);

  return (
    <>
      <AppHeader />
      <View className="flex-1 bg-[#080B0D]">
        <View className="px-6 pb-7">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[38px] font-bold tracking-tight text-white">
                Agenda
              </Text>

              <Text className="mt-1 text-[18px] text-[#969CA3]">
                Próximos 30 días
              </Text>
            </View>

            <View className="h-16 w-16 items-center justify-center rounded-full border border-[#252C31] bg-[#0D1215]">
              <Ionicons name="calendar-outline" size={30} color="#80D160" />
            </View>
          </View>
        </View>

        {loading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator color="#80D160" size="large" />
          </View>
        ) : error ? (
          <Text className="px-6 text-red-400">{error}</Text>
        ) : reservations.length === 0 ? (
          <Text className="px-6 text-[#A9B1B8]">Todavía no hay reservas.</Text>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pb-10"
          >
            {reservations.map((reservation) => (
              <ReservaCard
                key={reservation.id}
                reservation={reservation}
                imageUrl={courtImages[reservation.courtId]}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </>
  );
}
