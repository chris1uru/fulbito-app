import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { imagesApi, reservationsApi } from "../../../services/api";
import ReservaCard from "./ReservaCard";

export default function PlayerReservationsView() {
  const { top, bottom } = useSafeAreaInsets();
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [courtImages, setCourtImages] = useState({});

  const now = Date.now();
  const sortedReservations = [...reservations].sort(
    (a, b) => new Date(a.startsAt) - new Date(b.startsAt),
  );
  const upcomingReservations = sortedReservations.filter(
    (reservation) => new Date(reservation.startsAt).getTime() >= now,
  );
  const nextReservation = upcomingReservations.find(
    (reservation) => !reservation.status?.startsWith("CANCELLED"),
  );
  const laterReservations = upcomingReservations.filter(
    (reservation) => reservation.id !== nextReservation?.id,
  );
  const pastReservations = sortedReservations
    .filter((reservation) => new Date(reservation.startsAt).getTime() < now)
    .reverse();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError("");

      reservationsApi
        .mine()
        .then(async (data) => {
          const courtIds = [
            ...new Set(data.map((reservation) => reservation.courtId)),
          ];
          const results = await Promise.all(
            courtIds.map(async (courtId) => {
              const images = await imagesApi.courtList(courtId).catch(() => []);
              return [courtId, images[0]?.url];
            }),
          );
          return { data, images: Object.fromEntries(results) };
        })
        .then(({ data, images }) => {
          if (!active) return;
          setReservations(data);
          setCourtImages(images);
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
    }, []),
  );

  return (
    <View className="flex-1 bg-[#17191C]" style={{ paddingTop: top + 5 }}>
      <View className="px-4 pb-6 pt-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-semibold text-white">Agenda</Text>
            <Text className="mt-1 text-sm text-[#A9B1B8]">Tus reservas</Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#2C4930]">
            <Ionicons name="calendar-outline" size={30} color="#80D160" />
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center pb-20">
          <ActivityIndicator color="#80D160" size="large" />
        </View>
      ) : error ? (
        <View className="mx-4 flex-row items-center rounded-2xl border border-[#653B40] bg-[#2B2225] p-4">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#3A292D]">
            <Ionicons name="alert-circle-outline" size={21} color="#F08A93" />
          </View>
          <Text className="flex-1 text-sm leading-5 text-[#F08A93]">
            {error}
          </Text>
        </View>
      ) : reservations.length === 0 ? (
        <View className="mx-4 items-center rounded-3xl border border-dashed border-[#3B4249] bg-[#202428] px-6 py-12">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#2C4930]">
            <Ionicons name="calendar-clear-outline" size={28} color="#80D160" />
          </View>
          <Text className="mt-4 text-center font-medium text-[#A9B1B8]">
            Todavía no hay reservas.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: bottom + 88,
          }}
        >
          {nextReservation && (
            <>
              <Text className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
                Tu próxima reserva
              </Text>
              <ReservaCard
                reservation={nextReservation}
                imageUrl={courtImages[nextReservation.courtId]}
              />
            </>
          )}

          {laterReservations.length > 0 && (
            <Text
              className={`mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B949E] ${
                nextReservation ? "mt-2" : ""
              }`}
            >
              Más adelante
            </Text>
          )}
          {laterReservations.map((reservation) => (
            <ReservaCard
              key={reservation.id}
              reservation={reservation}
              imageUrl={courtImages[reservation.courtId]}
              variant="compact"
            />
          ))}

          {pastReservations.length > 0 && (
            <Text className="mb-3 mt-3 text-xs font-semibold uppercase tracking-widest text-[#69727B]">
              Anteriores
            </Text>
          )}
          {pastReservations.map((reservation) => (
            <ReservaCard
              key={reservation.id}
              reservation={reservation}
              imageUrl={courtImages[reservation.courtId]}
              variant="compact"
              isPast
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
