import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { imagesApi, reservationsApi } from "../../services/api";

export default function Reservas() {
  const { top } = useSafeAreaInsets();
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [courtImages, setCourtImages] = useState({});



  useEffect(() => {
  
    const load = user.role === "PLAYER"
  ? reservationsApi.mine()
  : reservationsApi.ownerAgenda(from.toISOString(), to.toISOString());


  load
    .then(async (data) => {
      setReservations(data);

      const results = await Promise.all(
        data.map(async (reservation) => {
          const images = await imagesApi.courtList(reservation.courtId);
          return [reservation.courtId, images[0]?.url];
        })
      );

      setCourtImages(Object.fromEntries(results));
    })
    .catch((e) => setError(e.message))
    .finally(() => setLoading(false));
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
            const imageUrl = courtImages[reservation.courtId];

            return (
              <View className="flex-row mb-3 rounded-2xl border border-[#30363D] bg-[#202428] p-4" key={reservation.id} >

                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    className="h-28 w-24 rounded-xl"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-28 w-24 items-center justify-center rounded-xl border border-dashed border-[#4A5158] bg-[#292D32]">
                    <Ionicons name="image-outline" size={25} color="#69727B" />
                    <Text className="mt-1 text-center text-[10px] text-[#8B949E]">
                      Imagen de cancha
                    </Text>
                  </View>
                )}

                <View className="ml-4">

                  <Text className="text-lg font-semibold text-white">
                    {reservation.venueName}
                  </Text>

                  <Text className="mt-1 text-gray-300">
                    {reservation.courtName}
                  </Text>

                  <Text className="mt-2 text-gray-300">
                    {startsAt.toLocaleDateString("es-UY")} · {startsAt.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  <View className="flex-col justify-between">
                    <View>
                      <Text className="mt-2 text-sm text-white flex">
                        Estado de la reserva: 
                      </Text>
                      <Text className="mt-2 text-sm text-[#80D160] flex">
                        {reservation.status} 
                      </Text>
                    </View>
                    <View>
                      <Text className="mt-2 text-sm text-white ">
                        Estado del pago:
                      </Text>
                      <Text className="mt-2 text-sm text-[#80D160] ">
                        {reservation.paymentStatus} 
                      </Text>
                    </View>
                  </View>
                  <Link href="../venueLayout" asChild>
                    <Pressable className="mt-4 items-center rounded-lg bg-[#2C4930] px-3 py-1.5">
                      <Text className="font-semibold text-[#80D160]">
                        Ver complejo
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
