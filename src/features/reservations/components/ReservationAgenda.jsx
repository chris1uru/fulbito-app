import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import {
  CollapsibleReservationSection,
  CompactReservationCard,
  FeaturedReservationCard,
  ReservationSectionTitle,
} from "./ReservationAgendaCards";

export default function ReservationAgenda({
  reservations,
  now,
  onReservationPress,
}) {
  const sortedReservations = [...reservations].sort(
    (a, b) => new Date(a.startsAt) - new Date(b.startsAt),
  );
  const cancelled = sortedReservations.filter((reservation) =>
    reservation.status?.startsWith("CANCELLED"),
  );
  const completed = sortedReservations.filter(
    (reservation) =>
      !reservation.status?.startsWith("CANCELLED") &&
      (reservation.status === "COMPLETED" ||
        new Date(reservation.endsAt).getTime() <= now),
  );
  const active = sortedReservations.filter(
    (reservation) =>
      !reservation.status?.startsWith("CANCELLED") &&
      reservation.status !== "COMPLETED" &&
      new Date(reservation.endsAt).getTime() > now,
  );
  const playing = active.filter((reservation) => {
    const startsAt = new Date(reservation.startsAt).getTime();
    const endsAt = new Date(reservation.endsAt).getTime();
    return startsAt <= now && now < endsAt;
  });
  const upcoming = active.filter(
    (reservation) => new Date(reservation.startsAt).getTime() > now,
  );
  const nextStartsAt = upcoming[0]
    ? new Date(upcoming[0].startsAt).getTime()
    : null;
  const nextReservations = upcoming.filter(
    (reservation) => new Date(reservation.startsAt).getTime() === nextStartsAt,
  );
  const later = upcoming.filter(
    (reservation) => new Date(reservation.startsAt).getTime() !== nextStartsAt,
  );

  if (reservations.length === 0) {
    return (
      <View className="items-center rounded-3xl border border-dashed border-[#3B4249] bg-[#202428] px-6 py-10">
        <Ionicons name="calendar-clear-outline" size={36} color="#69727B" />
        <Text className="mt-3 text-center font-semibold text-[#C5CBD1]">
          No hay reservas en este período
        </Text>
        <Text className="mt-1 text-center text-xs leading-5 text-[#8B949E]">
          Probá otro período o revisá los filtros aplicados.
        </Text>
      </View>
    );
  }

  return (
    <>
      {playing.length > 0 && (
        <>
          <ReservationSectionTitle
            title="En curso"
            count={playing.length}
            accent
          />
          {playing.map((reservation) => (
            <FeaturedReservationCard
              key={reservation.id}
              reservation={reservation}
              isPlaying
              onPress={() => onReservationPress(reservation)}
            />
          ))}
        </>
      )}

      {nextReservations.length > 0 && (
        <>
          <ReservationSectionTitle
            title="Próxima reserva"
            count={nextReservations.length}
            accent={playing.length === 0}
          />
          {nextReservations.map((reservation) => (
            <FeaturedReservationCard
              key={reservation.id}
              reservation={reservation}
              onPress={() => onReservationPress(reservation)}
            />
          ))}
        </>
      )}

      {later.length > 0 && (
        <>
          <ReservationSectionTitle title="Más tarde" count={later.length} />
          {later.map((reservation) => (
            <CompactReservationCard
              key={reservation.id}
              reservation={reservation}
              onPress={() => onReservationPress(reservation)}
            />
          ))}
        </>
      )}

      {playing.length === 0 &&
        nextReservations.length === 0 &&
        later.length === 0 && (
          <View className="mb-3 items-center rounded-2xl border border-[#30363D] bg-[#202428] px-5 py-6">
            <Ionicons
              name="checkmark-circle-outline"
              size={30}
              color="#69727B"
            />
            <Text className="mt-2 text-sm font-semibold text-[#A9B1B8]">
              No quedan reservas activas
            </Text>
          </View>
        )}

      <CollapsibleReservationSection
        title="Finalizadas"
        reservations={[...completed].reverse()}
        onReservationPress={onReservationPress}
      />
      <CollapsibleReservationSection
        title="Canceladas"
        reservations={cancelled}
        onReservationPress={onReservationPress}
      />
    </>
  );
}
