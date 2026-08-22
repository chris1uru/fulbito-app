import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import ReservationAgenda from "./ReservationAgenda";

function FilterChip({ active, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-lg border px-3 py-2 ${
        active
          ? "border-[#315C3B] bg-[#2C4930]"
          : "border-[#30363D] bg-[#292D32]"
      }`}
    >
      <Text
        className={`text-xs font-semibold ${
          active ? "text-[#80D160]" : "text-[#A9B1B8]"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ReservationManagementList({
  reservations,
  venues,
  courts,
  venueFilter,
  onVenueFilterChange,
  showVenueFilter,
  query,
  onQueryChange,
  courtFilter,
  onCourtFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  statusFilter,
  onStatusFilterChange,
  loading,
  error,
  onRetry,
  onReservationPress,
}) {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleCourts = courts.filter(
    (court) => venueFilter === "ALL" || court.venueId === venueFilter,
  );
  const filteredReservations = reservations
    .filter(
      (reservation) =>
        venueFilter === "ALL" || reservation.venueId === venueFilter,
    )
    .filter(
      (reservation) =>
        !normalizedQuery ||
        reservation.playerName?.toLowerCase().includes(normalizedQuery),
    )
    .filter(
      (reservation) =>
        courtFilter === "ALL" || reservation.courtId === courtFilter,
    )
    .filter(
      (reservation) =>
        paymentFilter === "ALL" || reservation.paymentStatus === paymentFilter,
    )
    .filter((reservation) => {
      if (statusFilter === "ALL") return true;
      if (statusFilter === "CANCELLED") {
        return reservation.status?.startsWith("CANCELLED");
      }
      return reservation.status === statusFilter;
    });

  return (
    <>
      <View className="mx-4 mb-4 overflow-hidden rounded-2xl border border-[#30363D] bg-[#202428]">
        <Pressable
          onPress={() => setFiltersExpanded((current) => !current)}
          className="flex-row items-center justify-between px-4 py-4"
          accessibilityRole="button"
          accessibilityState={{ expanded: filtersExpanded }}
        >
          <View className="flex-row items-center">
            <Ionicons name="options-outline" size={19} color="#80D160" />
            <Text className="ml-2 font-semibold text-white">Filtros</Text>
          </View>
          <Ionicons
            name={filtersExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#A9B1B8"
          />
        </Pressable>

        {filtersExpanded && (
          <View className="border-t border-[#30363D] px-4 pb-4 pt-4">
            <View className="flex-row items-center rounded-xl border border-[#30363D] bg-[#17191C] px-3">
              <Ionicons name="search-outline" size={18} color="#80D160" />
              <TextInput
                value={query}
                onChangeText={onQueryChange}
                placeholder="Buscar jugador"
                placeholderTextColor="#69727B"
                className="h-11 flex-1 px-3 text-white"
              />
            </View>

            {showVenueFilter && (
              <>
                <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-widest text-[#69727B]">
                  Complejo
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {venues.map((venue) => (
                    <FilterChip
                      key={venue.id}
                      label={venue.name}
                      active={venueFilter === venue.id}
                      onPress={() => onVenueFilterChange(venue.id)}
                    />
                  ))}
                </View>
              </>
            )}

            <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-widest text-[#69727B]">
              Cancha
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <FilterChip
                label="Todas"
                active={courtFilter === "ALL"}
                onPress={() => onCourtFilterChange("ALL")}
              />
              {visibleCourts.map((court) => (
                <FilterChip
                  key={court.id}
                  label={court.name}
                  active={courtFilter === court.id}
                  onPress={() => onCourtFilterChange(court.id)}
                />
              ))}
            </View>

            <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-widest text-[#69727B]">
              Estado del pago
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <FilterChip
                label="Todos"
                active={paymentFilter === "ALL"}
                onPress={() => onPaymentFilterChange("ALL")}
              />
              <FilterChip
                label="Pendientes"
                active={paymentFilter === "PENDING"}
                onPress={() => onPaymentFilterChange("PENDING")}
              />
              <FilterChip
                label="Pagos"
                active={paymentFilter === "PAID"}
                onPress={() => onPaymentFilterChange("PAID")}
              />
            </View>

            <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-widest text-[#69727B]">
              Estado de la reserva
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <FilterChip
                label="Todas"
                active={statusFilter === "ALL"}
                onPress={() => onStatusFilterChange("ALL")}
              />
              <FilterChip
                label="Confirmadas"
                active={statusFilter === "CONFIRMED"}
                onPress={() => onStatusFilterChange("CONFIRMED")}
              />
              <FilterChip
                label="Canceladas"
                active={statusFilter === "CANCELLED"}
                onPress={() => onStatusFilterChange("CANCELLED")}
              />
            </View>
          </View>
        )}
      </View>

      <View className="px-4">
        {loading ? (
          <View className="h-44 items-center justify-center rounded-3xl border border-[#30363D] bg-[#202428]">
            <ActivityIndicator color="#80D160" size="large" />
            <Text className="mt-3 text-sm text-[#A9B1B8]">
              Cargando reservas...
            </Text>
          </View>
        ) : error ? (
          <View className="items-center rounded-3xl border border-[#653B40] bg-[#2B2225] px-6 py-8">
            <Ionicons name="cloud-offline-outline" size={34} color="#F08A93" />
            <Text className="mt-3 text-center text-sm text-[#F08A93]">
              {error}
            </Text>
            <Pressable
              onPress={onRetry}
              className="mt-4 rounded-xl bg-[#3A292D] px-5 py-3"
            >
              <Text className="font-semibold text-[#F08A93]">Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <ReservationAgenda
            reservations={filteredReservations}
            now={now}
            onReservationPress={onReservationPress}
          />
        )}
      </View>
    </>
  );
}
