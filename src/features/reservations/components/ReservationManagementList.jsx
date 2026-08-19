import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TextInput, View } from "react-native";

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
    <Text
      onPress={onPress}
      className={`mr-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
        active
          ? "border-[#315C3B] bg-[#2C4930] text-[#80D160]"
          : "border-[#30363D] bg-[#292D32] text-[#A9B1B8]"
      }`}
    >
      {label}
    </Text>
  );
}

function formatAmount(amount, currency) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "Sin monto";
  return `${currency === "UYU" ? "$" : `${currency ?? "$"} `}${value.toLocaleString("es-UY")}`;
}

function ReservationRow({ reservation }) {
  const startsAt = new Date(reservation.startsAt);
  const isCancelled = reservation.status?.startsWith("CANCELLED");
  const isPaid = reservation.paymentStatus === "PAID";

  return (
    <View className="mb-3 rounded-2xl border border-[#30363D] bg-[#202428] p-4">
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
    </View>
  );
}

export default function ReservationManagementList({
  reservations,
  courts,
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
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const filteredReservations = reservations
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
      <View className="mx-4 mb-4 rounded-2xl border border-[#30363D] bg-[#202428] p-4">
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

        <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-widest text-[#69727B]">
          Cancha
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip
            label="Todas"
            active={courtFilter === "ALL"}
            onPress={() => onCourtFilterChange("ALL")}
          />
          {courts.map((court) => (
            <FilterChip
              key={court.id}
              label={
                court.venueName
                  ? `${court.name} · ${court.venueName}`
                  : court.name
              }
              active={courtFilter === court.id}
              onPress={() => onCourtFilterChange(court.id)}
            />
          ))}
        </ScrollView>

        <Text className="mb-2 mt-3 text-xs font-semibold uppercase tracking-widest text-[#69727B]">
          Ordenar por
        </Text>
        <View className="flex-row">
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

        <Text className="mb-2 mt-3 text-xs font-semibold uppercase tracking-widest text-[#69727B]">
          Estado del pago
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
        </ScrollView>

        <Text className="mb-2 mt-3 text-xs font-semibold uppercase tracking-widest text-[#69727B]">
          Estado de la reserva
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
        </ScrollView>
      </View>

      <View className="px-4">
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
            <ReservationRow key={reservation.id} reservation={reservation} />
          ))
        )}
      </View>
    </>
  );
}
