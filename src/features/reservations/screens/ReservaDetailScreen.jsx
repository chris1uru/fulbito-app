import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../providers/AuthProvider";
import { reservationsApi } from "../../../services/api";

const RESERVATION_STATUS = {
  CONFIRMED: "Confirmada",
  CANCELLED_BY_OWNER: "Cancelada por el complejo",
  CANCELLED_BY_PLAYER: "Cancelada por el jugador",
};

const PAYMENT_STATUS = {
  PENDING: "Pendiente",
  PAID: "Pago confirmado",
};

function formatAmount(amount, currency) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "Sin monto";
  const prefix = currency === "UYU" ? "$" : `${currency ?? "$"} `;
  return `${prefix}${value.toLocaleString("es-UY")}`;
}

function formatDateTime(value) {
  return value.toLocaleString("es-UY", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ icon, label, children }) {
  return (
    <View className="flex-row items-center py-4">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#292D32]">
        <Ionicons name={icon} size={19} color="#80D160" />
      </View>
      <View className="flex-1">
        <Text className="text-xs text-[#8B949E]">{label}</Text>
        <Text className="mt-1 font-medium text-white">{children}</Text>
      </View>
    </View>
  );
}

export default function ReservaDetailScreen() {
  const params = useLocalSearchParams();
  const reservationId = Array.isArray(params.reservationId)
    ? params.reservationId[0]
    : params.reservationId;
  const router = useRouter();
  const { user } = useAuth();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [error, setError] = useState("");

  const loadReservation = useCallback(async () => {
    if (!reservationId) {
      setError("No se pudo identificar la reserva.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      setReservation(await reservationsApi.one(reservationId));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useFocusEffect(
    useCallback(() => {
      loadReservation();
    }, [loadReservation]),
  );

  const cancelReservation = useCallback(async () => {
    try {
      setCancelling(true);
      const updatedReservation =
        user.role === "PLAYER"
          ? await reservationsApi.cancelPlayer(reservationId)
          : await reservationsApi.cancelOwner(reservationId);
      setReservation(updatedReservation);
      Alert.alert(
        updatedReservation.lateCancellation
          ? "Cancelación tardía registrada"
          : "Reserva cancelada",
        updatedReservation.lateCancellation
          ? "El turno fue liberado y la cancelación quedó registrada como fuera de plazo."
          : "El turno fue liberado correctamente.",
      );
    } catch (requestError) {
      Alert.alert("No se pudo cancelar", requestError.message);
    } finally {
      setCancelling(false);
    }
  }, [reservationId, user.role]);

  const markReservationPaid = useCallback(async () => {
    try {
      setMarkingPaid(true);
      setReservation(await reservationsApi.markPaid(reservationId));
      Alert.alert(
        "Pago confirmado",
        "La reserva quedó registrada como pagada.",
      );
    } catch (requestError) {
      Alert.alert("No se pudo confirmar el pago", requestError.message);
    } finally {
      setMarkingPaid(false);
    }
  }, [reservationId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#17191C]">
        <ActivityIndicator color="#80D160" size="large" />
        <Text className="mt-3 text-[#A9B1B8]">Cargando reserva...</Text>
      </View>
    );
  }

  if (error || !reservation) {
    return (
      <SafeAreaView className="flex-1 bg-[#17191C]">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={42} color="#F08A93" />
          <Text className="mt-4 text-center text-xl font-semibold text-white">
            No pudimos abrir la reserva
          </Text>
          <Text className="mt-2 text-center text-[#A9B1B8]">{error}</Text>
          <Pressable
            onPress={loadReservation}
            className="mt-6 rounded-xl bg-[#80D160] px-6 py-3"
          >
            <Text className="font-semibold text-[#152012]">Reintentar</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} className="mt-3 px-6 py-3">
            <Text className="font-semibold text-[#A9B1B8]">Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const startsAt = new Date(reservation.startsAt);
  const endsAt = new Date(reservation.endsAt);
  const isCancelled = reservation.status?.startsWith("CANCELLED");
  const cancellationNoticeHours = reservation.cancellationNoticeHours ?? 4;
  const apiCancellationDeadline = new Date(reservation.cancellationDeadline);
  const cancellationDeadline = Number.isNaN(apiCancellationDeadline.getTime())
    ? new Date(startsAt.getTime() - cancellationNoticeHours * 60 * 60 * 1000)
    : apiCancellationDeadline;
  const isLateNow = Date.now() > cancellationDeadline.getTime();
  const isManager = user.role === "OWNER" || user.role === "ADMIN";
  const showPlayerLateWarning =
    user.role === "PLAYER" && !isCancelled && isLateNow;
  const canCancel =
    reservation.status === "CONFIRMED" && reservation.paymentStatus !== "PAID";
  const canMarkPaid =
    isManager &&
    reservation.status === "CONFIRMED" &&
    reservation.paymentStatus === "PENDING";

  function confirmCancellation() {
    if (isManager) {
      Alert.alert(
        "Cancelar reserva",
        "Se liberará el turno y esta acción no se puede deshacer.",
        [
          { text: "Volver", style: "cancel" },
          {
            text: "Confirmar cancelación",
            style: "destructive",
            onPress: cancelReservation,
          },
        ],
      );
      return;
    }

    const lateAtConfirmation = Date.now() > cancellationDeadline.getTime();
    Alert.alert(
      lateAtConfirmation ? "Cancelación fuera de plazo" : "Cancelar reserva",
      lateAtConfirmation
        ? "Esta cancelación quedará registrada como tardía. En este MVP todavía no se aplica una sanción automática."
        : `Se liberará el turno. Estás dentro del plazo de ${cancellationNoticeHours} horas definido por el complejo.`,
      [
        { text: "Volver", style: "cancel" },
        {
          text: lateAtConfirmation
            ? "Cancelar de todos modos"
            : "Confirmar cancelación",
          style: "destructive",
          onPress: cancelReservation,
        },
      ],
    );
  }

  function confirmPayment() {
    Alert.alert(
      "Confirmar pago",
      `¿Confirmás que recibiste ${formatAmount(
        reservation.priceAmount,
        reservation.currency,
      )} por la reserva de ${reservation.playerName}? Esta acción no se puede deshacer desde la app.`,
      [
        { text: "Volver", style: "cancel" },
        {
          text: "Marcar como pagada",
          onPress: markReservationPaid,
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#17191C]" edges={["top", "bottom"]}>
      <View className="flex-row items-center px-5 pb-4 pt-3">
        <Pressable
          onPress={() => router.back()}
          className="mr-4 h-11 w-11 items-center justify-center rounded-xl border border-[#30363D] bg-[#202428]"
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-white">
            Detalle de reserva
          </Text>
          <Text className="mt-0.5 text-sm text-[#8B949E]">
            Información del turno
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-10"
      >
        <View className="rounded-3xl border border-[#30363D] bg-[#202428] p-5">
          <View className="flex-row items-start justify-between">
            <View className="mr-3 flex-1">
              <Text className="text-2xl font-bold text-white">
                {reservation.venueName}
              </Text>
              <Text className="mt-1 text-[#A9B1B8]">
                {reservation.courtName}
              </Text>
            </View>
            <View
              className={`rounded-full px-3 py-1.5 ${
                isCancelled ? "bg-[#3A292D]" : "bg-[#2C4930]"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isCancelled ? "text-[#F08A93]" : "text-[#80D160]"
                }`}
              >
                {RESERVATION_STATUS[reservation.status] ?? reservation.status}
              </Text>
            </View>
          </View>

          <View className="mt-5 rounded-2xl bg-[#17191C] px-4">
            <InfoRow icon="calendar-outline" label="Fecha">
              {startsAt.toLocaleDateString("es-UY", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </InfoRow>
            <View className="h-px bg-[#30363D]" />
            <InfoRow icon="time-outline" label="Horario">
              {startsAt.toLocaleTimeString("es-UY", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" a "}
              {endsAt.toLocaleTimeString("es-UY", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </InfoRow>
            <View className="h-px bg-[#30363D]" />
            <InfoRow icon="person-outline" label="Jugador">
              {reservation.playerName}
            </InfoRow>
            {!!reservation.playerPhone && (
              <>
                <View className="h-px bg-[#30363D]" />
                <InfoRow icon="call-outline" label="Teléfono">
                  {reservation.playerPhone}
                </InfoRow>
              </>
            )}
          </View>
        </View>

        <View className="mt-5 rounded-2xl border border-[#30363D] bg-[#202428] p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-[#8B949E]">Importe</Text>
              <Text className="mt-1 text-xl font-bold text-white">
                {formatAmount(reservation.priceAmount, reservation.currency)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-[#8B949E]">Pago</Text>
              <Text
                className={`mt-1 font-semibold ${
                  reservation.paymentStatus === "PAID"
                    ? "text-[#80D160]"
                    : "text-[#F4C95D]"
                }`}
              >
                {PAYMENT_STATUS[reservation.paymentStatus] ??
                  reservation.paymentStatus}
              </Text>
            </View>
          </View>
        </View>

        <View
          className={`mt-5 rounded-2xl border p-4 ${
            reservation.lateCancellation || showPlayerLateWarning
              ? "border-[#6D4E2B] bg-[#2B261D]"
              : "border-[#315C3B] bg-[#142019]"
          }`}
        >
          <View className="flex-row items-start">
            <Ionicons
              name={
                reservation.lateCancellation || showPlayerLateWarning
                  ? "warning-outline"
                  : "shield-checkmark-outline"
              }
              size={22}
              color={
                reservation.lateCancellation || showPlayerLateWarning
                  ? "#F4C95D"
                  : "#80D160"
              }
            />
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-white">
                {reservation.lateCancellation
                  ? "Cancelación tardía registrada"
                  : showPlayerLateWarning
                    ? "Plazo de cancelación superado"
                    : "Política de cancelación"}
              </Text>
              <Text className="mt-1 text-xs leading-5 text-[#C5CBD1]">
                Fecha límite: {formatDateTime(cancellationDeadline)}
              </Text>
              <Text className="mt-1 text-xs leading-5 text-[#A9B1B8]">
                Esta reserva conserva el plazo de {cancellationNoticeHours}{" "}
                horas que tenía el complejo al confirmarla.
              </Text>
              {showPlayerLateWarning && (
                <Text className="mt-2 text-xs leading-5 text-[#F4C95D]">
                  Si cancelás ahora quedará registrada como tardía. En esta
                  versión no se aplica una sanción automática.
                </Text>
              )}
              {reservation.paymentStatus === "PAID" && !isCancelled && (
                <Text className="mt-2 text-xs leading-5 text-[#F4C95D]">
                  El pago ya fue confirmado, por lo que no se puede cancelar
                  desde la app.
                </Text>
              )}
            </View>
          </View>
        </View>

        {!!reservation.notes && (
          <View className="mt-5 rounded-2xl border border-[#30363D] bg-[#202428] p-4">
            <Text className="text-xs text-[#8B949E]">Observaciones</Text>
            <Text className="mt-2 leading-5 text-[#C5CBD1]">
              {reservation.notes}
            </Text>
          </View>
        )}

        {canMarkPaid && (
          <Pressable
            disabled={markingPaid || cancelling}
            onPress={confirmPayment}
            className={`mt-5 items-center rounded-xl bg-[#80D160] py-4 ${
              markingPaid || cancelling ? "opacity-60" : ""
            }`}
          >
            {markingPaid ? (
              <ActivityIndicator color="#152012" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#152012"
                />
                <Text className="ml-2 font-semibold text-[#152012]">
                  Marcar como pagada
                </Text>
              </View>
            )}
          </Pressable>
        )}

        {canCancel && (
          <Pressable
            disabled={cancelling || markingPaid}
            onPress={confirmCancellation}
            className={`mt-5 items-center rounded-xl border border-[#653B40] bg-[#2B2225] py-4 ${
              cancelling || markingPaid ? "opacity-60" : ""
            }`}
          >
            {cancelling ? (
              <ActivityIndicator color="#F08A93" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color="#F08A93"
                />
                <Text className="ml-2 font-semibold text-[#F08A93]">
                  Cancelar reserva
                </Text>
              </View>
            )}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
