import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

const PAYMENT_LABELS = {
  PENDING: "Pendiente",
  PAID: "Pago",
  REFUNDED: "Reembolsado",
};

const RESERVATION_LABELS = {
  CONFIRMED: "Confirmada",
  CANCELLED_BY_OWNER: "Cancelada por el complejo",
  CANCELLED_BY_PLAYER: "Cancelada por el jugador",
  COMPLETED: "Finalizada",
};

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

function formatAmount(amount, currency) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "Sin monto";
  return `${currency === "UYU" ? "$" : `${currency ?? "$"} `}${value.toLocaleString("es-UY")}`;
}

function ReservationRow({ reservation, onPress }) {
  const startsAt = new Date(reservation.startsAt);
  const isCancelled = reservation.status?.startsWith("CANCELLED");
  const isPaid = reservation.paymentStatus === "PAID";

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl border border-[#30363D] bg-[#202428] p-4"
    >
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-xs text-[#8B949E]">Cancha</Text>
          <Text className="mt-0.5 font-semibold text-white">
            {reservation.courtName}
          </Text>
          <Text className="mt-1 text-xs text-[#69727B]">
            {reservation.venueName}
          </Text>
        </View>
        <View
          className={`rounded-full px-2.5 py-1 ${
            isCancelled ? "bg-[#3A292D]" : "bg-[#2C4930]"
          }`}
        >
          <Text
            className={`text-[10px] font-semibold ${
              isCancelled ? "text-[#F08A93]" : "text-[#80D160]"
            }`}
          >
            {RESERVATION_LABELS[reservation.status] ?? reservation.status}
          </Text>
        </View>
      </View>

      <View className="my-3 h-px bg-[#30363D]" />

      <View className="flex-row">
        <View className="mr-3 flex-1">
          <Text className="text-xs text-[#8B949E]">Jugador</Text>
          <View className="mt-1 flex-row items-center">
            <Ionicons name="person-outline" size={15} color="#80D160" />
            <Text
              numberOfLines={1}
              className="ml-1.5 flex-1 text-sm text-white"
            >
              {reservation.playerName || "Carga manual"}
            </Text>
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-[#8B949E]">Fecha y hora</Text>
          <Text className="mt-1 text-sm text-white">
            {startsAt.toLocaleDateString("es-UY")}
          </Text>
          <Text className="mt-0.5 text-xs text-[#A9B1B8]">
            {startsAt.toLocaleTimeString("es-UY", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row rounded-xl bg-[#292D32] p-3">
        <View className="flex-1">
          <Text className="text-xs text-[#8B949E]">Monto</Text>
          <Text className="mt-1 font-semibold text-white">
            {formatAmount(reservation.priceAmount, reservation.currency)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-[#8B949E]">Estado del pago</Text>
          <View className="mt-1 flex-row items-center">
            <View
              className={`mr-1.5 h-2 w-2 rounded-full ${
                isPaid ? "bg-[#80D160]" : "bg-[#F4C95D]"
              }`}
            />
            <Text
              className={`text-sm font-medium ${
                isPaid ? "text-[#80D160]" : "text-[#F4C95D]"
              }`}
            >
              {PAYMENT_LABELS[reservation.paymentStatus] ??
                reservation.paymentStatus}
            </Text>
          </View>
        </View>
      </View>
      <View className="mt-3 flex-row items-center justify-end">
        <Text className="mr-1 text-xs font-semibold text-[#80D160]">
          Ver detalle
        </Text>
        <Ionicons name="chevron-forward" size={15} color="#80D160" />
      </View>
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
  sortBy,
  onSortChange,
  loading,
  error,
  onRetry,
  onReservationPress,
}) {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
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
    })
    .sort((a, b) => {
      if (sortBy === "AMOUNT") {
        return Number(b.priceAmount ?? 0) - Number(a.priceAmount ?? 0);
      }
      return new Date(a.startsAt) - new Date(b.startsAt);
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
              Ordenar por
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <FilterChip
                label="Fecha y hora"
                active={sortBy === "DATE"}
                onPress={() => onSortChange("DATE")}
              />
              <FilterChip
                label="Monto"
                active={sortBy === "AMOUNT"}
                onPress={() => onSortChange("AMOUNT")}
              />
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
          <>
            <Text className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
              {filteredReservations.length}{" "}
              {filteredReservations.length === 1 ? "reserva" : "reservas"}
            </Text>
            {filteredReservations.length === 0 ? (
              <View className="items-center rounded-3xl border border-dashed border-[#3B4249] bg-[#202428] px-6 py-10">
                <Ionicons name="filter-outline" size={34} color="#69727B" />
                <Text className="mt-3 text-center text-sm text-[#A9B1B8]">
                  No hay reservas que coincidan con los filtros.
                </Text>
              </View>
            ) : (
              filteredReservations.map((reservation) => (
                <ReservationRow
                  key={reservation.id}
                  reservation={reservation}
                  onPress={() => onReservationPress(reservation)}
                />
              ))
            )}
          </>
        )}
      </View>
    </>
  );
}
