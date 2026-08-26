import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  formatUruguayDate,
  formatUruguayTime,
} from "../../../utils/uruguayDateTime";

const PAYMENT_LABELS = {
  PENDING: "Pendiente",
  PAID: "Pago",
  REFUNDED: "Reembolsado",
};

const RESERVATION_LABELS = {
  CANCELLED_BY_OWNER: "Cancelada por el complejo",
  CANCELLED_BY_PLAYER: "Cancelada por el jugador",
};

function timeLabel(value) {
  return formatUruguayTime(value);
}

function dateLabel(value, short = false) {
  return formatUruguayDate(
    value,
    short
      ? { day: "numeric", month: "short" }
      : { weekday: "long", day: "numeric", month: "long" },
  );
}

export function FeaturedReservationCard({ reservation, isPlaying, onPress }) {
  const isPaid = reservation.paymentStatus === "PAID";

  return (
    <Pressable
      onPress={onPress}
      className={`mb-3 rounded-3xl border p-5 ${
        isPlaying
          ? "border-[#4D8545] bg-[#243B28]"
          : "border-[#315C3B] bg-[#202E23]"
      }`}
    >
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <View className="mb-2 flex-row items-center">
            <View
              className={`mr-2 h-2.5 w-2.5 rounded-full ${
                isPlaying ? "bg-[#80D160]" : "bg-[#F4C95D]"
              }`}
            />
            <Text
              className={`text-xs font-bold uppercase tracking-widest ${
                isPlaying ? "text-[#80D160]" : "text-[#F4C95D]"
              }`}
            >
              {isPlaying ? "En juego" : "Próxima"}
            </Text>
          </View>
          <Text className="text-xs capitalize text-[#A9B1B8]">
            {dateLabel(reservation.startsAt)}
          </Text>
          <Text className="mt-1 text-2xl font-bold text-white">
            {timeLabel(reservation.startsAt)} - {timeLabel(reservation.endsAt)}
          </Text>
          <Text className="mt-1 text-base font-semibold text-[#DDE3E7]">
            {reservation.courtName}
          </Text>
          <Text className="mt-0.5 text-xs text-[#8B949E]">
            {reservation.venueName}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#80D160" />
      </View>

      <View className="mt-4 flex-row items-center rounded-2xl bg-[#17191C]/70 px-4 py-3">
        <Ionicons name="person-outline" size={18} color="#80D160" />
        <Text numberOfLines={1} className="ml-2 flex-1 text-sm text-white">
          {reservation.playerName || "Carga manual"}
        </Text>
        <Text className="mr-2 text-xs text-[#A9B1B8]">Pago:</Text>
        <View
          className={`mr-1.5 h-2 w-2 rounded-full ${
            isPaid ? "bg-[#80D160]" : "bg-[#F4C95D]"
          }`}
        />
        <Text
          className={`text-xs font-semibold ${
            isPaid ? "text-[#80D160]" : "text-[#F4C95D]"
          }`}
        >
          {PAYMENT_LABELS[reservation.paymentStatus] ??
            reservation.paymentStatus}
        </Text>
      </View>
    </Pressable>
  );
}

export function CompactReservationCard({
  reservation,
  muted = false,
  onPress,
}) {
  const isCancelled = reservation.status?.startsWith("CANCELLED");
  const isPaid = reservation.paymentStatus === "PAID";

  return (
    <Pressable
      onPress={onPress}
      className={`mb-2 flex-row items-center rounded-2xl border border-[#30363D] bg-[#202428] p-3.5 ${
        muted ? "opacity-60" : ""
      }`}
    >
      <View className="mr-3 w-20 items-center rounded-xl bg-[#292D32] py-2">
        <Text className="text-[10px] font-semibold uppercase text-[#8B949E]">
          {dateLabel(reservation.startsAt, true)}
        </Text>
        <Text className="mt-1 text-xs font-bold text-white">
          {timeLabel(reservation.startsAt)}
        </Text>
        <Text className="text-[10px] text-[#69727B]">
          a {timeLabel(reservation.endsAt)}
        </Text>
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="font-semibold text-white">
          {reservation.courtName}
        </Text>
        <Text numberOfLines={1} className="mt-1 text-xs text-[#A9B1B8]">
          {reservation.playerName || "Carga manual"}
        </Text>
        <View className="mt-1.5 flex-row items-center">
          <Text className="mr-1.5 text-xs text-[#A9B1B8]">
            {isCancelled ? "Estado:" : "Pago:"}
          </Text>
          <View
            className={`mr-1.5 h-2 w-2 rounded-full ${
              isCancelled
                ? "bg-[#F08A93]"
                : isPaid
                  ? "bg-[#80D160]"
                  : "bg-[#F4C95D]"
            }`}
          />
          <Text
            numberOfLines={1}
            className={`flex-1 text-xs font-semibold ${
              isCancelled
                ? "text-[#F08A93]"
                : isPaid
                  ? "text-[#80D160]"
                  : "text-[#F4C95D]"
            }`}
          >
            {isCancelled
              ? (RESERVATION_LABELS[reservation.status] ?? "Cancelada")
              : (PAYMENT_LABELS[reservation.paymentStatus] ??
                reservation.paymentStatus)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#69727B" />
    </Pressable>
  );
}

export function ReservationSectionTitle({ title, count, accent = false }) {
  return (
    <View className="mb-3 mt-2 flex-row items-center justify-between">
      <Text
        className={`text-xs font-bold uppercase tracking-widest ${
          accent ? "text-[#80D160]" : "text-[#8B949E]"
        }`}
      >
        {title}
      </Text>
      <View className="rounded-full bg-[#292D32] px-2 py-1">
        <Text className="text-[10px] font-bold text-[#A9B1B8]">{count}</Text>
      </View>
    </View>
  );
}

export function CollapsibleReservationSection({
  title,
  reservations,
  onReservationPress,
}) {
  const [expanded, setExpanded] = useState(false);

  if (reservations.length === 0) return null;

  return (
    <View className="mt-2">
      <Pressable
        onPress={() => setExpanded((current) => !current)}
        className="mb-2 flex-row items-center justify-between rounded-xl border border-[#30363D] bg-[#1D2024] px-4 py-3"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View className="flex-row items-center">
          <Text className="text-xs font-bold uppercase tracking-widest text-[#69727B]">
            {title}
          </Text>
          <Text className="ml-2 text-xs font-semibold text-[#69727B]">
            {reservations.length}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#69727B"
        />
      </Pressable>
      {expanded &&
        reservations.map((reservation) => (
          <CompactReservationCard
            key={reservation.id}
            reservation={reservation}
            muted
            onPress={() => onReservationPress(reservation)}
          />
        ))}
    </View>
  );
}
