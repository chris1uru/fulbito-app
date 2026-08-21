import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppAlert as Alert } from "../../../components/common/AppAlert";
import { useAuth } from "../../../providers/AuthProvider";
import { courtsApi, reservationsApi, venuesApi } from "../../../services/api";

function single(value) {
  return Array.isArray(value) ? value[0] : value;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function validDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && dateKey(parsed) === value;
}

function dateLabel(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-UY", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function slotTime(value) {
  return new Date(value).toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount, currency) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "Sin precio";
  return `${currency === "UYU" ? "$" : `${currency ?? "$"} `}${value.toLocaleString("es-UY")}`;
}

function FormField({ label, value, onChangeText, ...props }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#69727B"
        className={`rounded-xl border border-[#30363D] bg-[#17191C] px-4 py-3 text-white ${
          props.multiline ? "min-h-24" : "min-h-13"
        }`}
        {...props}
      />
    </View>
  );
}

export default function ManualReservationScreen() {
  const params = useLocalSearchParams();
  const initialVenueId = single(params.venueId);
  const router = useRouter();
  const { user } = useAuth();
  const today = dateKey(new Date());
  const quickDates = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index);
        return dateKey(date);
      }),
    [],
  );

  const [venues, setVenues] = useState([]);
  const [courts, setCourts] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState(initialVenueId ?? "");
  const [selectedCourtId, setSelectedCourtId] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [courtsLoading, setCourtsLoading] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadVenues =
      user.role === "ADMIN" ? venuesApi.adminList() : venuesApi.mine();

    loadVenues
      .then((data) => {
        const activeVenues = data.filter((venue) => venue.status === "ACTIVE");
        setVenues(activeVenues);
        setSelectedVenueId((current) =>
          activeVenues.some((venue) => venue.id === current)
            ? current
            : activeVenues[0]?.id || "",
        );
        if (activeVenues.length === 0) {
          setError("No hay complejos activos disponibles para reservar.");
        }
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [user.role]);

  useEffect(() => {
    setCourts([]);
    setSelectedCourtId("");
    setSelectedSlot(null);
    setAvailability(null);
    if (!selectedVenueId) return;

    let active = true;
    setCourtsLoading(true);
    courtsApi
      .managedList(selectedVenueId)
      .then((data) => {
        if (!active) return;
        const activeCourts = data.filter((court) => court.active);
        setCourts(activeCourts);
        setSelectedCourtId(activeCourts[0]?.id || "");
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setCourtsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedVenueId]);

  useEffect(() => {
    setSelectedSlot(null);
    setAvailability(null);
    setAvailabilityError("");
    setAvailabilityLoading(false);
    if (
      !selectedCourtId ||
      !validDateKey(selectedDate) ||
      selectedDate < today
    ) {
      return;
    }

    let active = true;
    setAvailabilityLoading(true);
    courtsApi
      .availability(selectedCourtId, selectedDate)
      .then((data) => {
        if (active) setAvailability(data);
      })
      .catch((requestError) => {
        if (active) setAvailabilityError(requestError.message);
      })
      .finally(() => {
        if (active) setAvailabilityLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedCourtId, selectedDate, today]);

  const selectedVenue = venues.find((venue) => venue.id === selectedVenueId);
  const selectedCourt = courts.find((court) => court.id === selectedCourtId);

  async function saveReservation() {
    try {
      setSaving(true);
      await reservationsApi.create({
        courtId: selectedCourtId,
        startsAt: selectedSlot.startsAt,
        endsAt: selectedSlot.endsAt,
        playerName: playerName.trim(),
        playerPhone: playerPhone.trim() || null,
        notes: notes.trim() || null,
      });
      Alert.alert(
        "Reserva manual creada",
        "El turno quedó ocupado y ya aparece en la agenda.",
        [{ text: "Aceptar", onPress: () => router.back() }],
      );
    } catch (requestError) {
      Alert.alert("No se pudo crear la reserva", requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmReservation() {
    if (!selectedVenue || !selectedCourt || !selectedSlot) {
      Alert.alert(
        "Falta seleccionar el turno",
        "Elegí complejo, cancha, fecha y horario.",
      );
      return;
    }
    if (!playerName.trim()) {
      Alert.alert(
        "Falta el jugador",
        "Ingresá el nombre de la persona que reservó.",
      );
      return;
    }
    const cleanPhone = playerPhone.trim();
    if (cleanPhone && !/^\+[1-9][0-9]{7,14}$/.test(cleanPhone)) {
      Alert.alert(
        "Teléfono inválido",
        "Usá formato internacional, por ejemplo +59899123456.",
      );
      return;
    }

    Alert.alert(
      "Confirmar reserva manual",
      `${playerName.trim()}\n${selectedVenue.name} · ${selectedCourt.name}\n${dateLabel(selectedDate)} a las ${slotTime(selectedSlot.startsAt)}\n${formatAmount(selectedCourt.pricePerSlot, selectedCourt.currency)}`,
      [
        { text: "Volver", style: "cancel" },
        { text: "Crear reserva", onPress: saveReservation },
      ],
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#17191C]">
        <ActivityIndicator color="#80D160" size="large" />
        <Text className="mt-3 text-[#A9B1B8]">Cargando complejos...</Text>
      </View>
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
          <Text className="text-2xl font-bold text-white">Reserva manual</Text>
          <Text className="mt-0.5 text-sm text-[#8B949E]">
            Para reservas recibidas fuera de Fulbito
          </Text>
        </View>
      </View>

      {error ? (
        <View className="mx-5 mt-5 rounded-2xl border border-[#653B40] bg-[#2B2225] p-4">
          <Text className="text-center text-sm text-[#F08A93]">{error}</Text>
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-5 pb-10"
        >
          <View className="mb-5 rounded-3xl border border-[#30363D] bg-[#202428] p-4">
            <Text className="text-lg font-semibold text-white">Complejo</Text>
            <Text className="mb-3 mt-1 text-xs text-[#8B949E]">
              Sólo aparecen complejos activos.
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {venues.map((venue) => (
                <Pressable
                  key={venue.id}
                  onPress={() => setSelectedVenueId(venue.id)}
                  className={`mr-2 rounded-xl border px-4 py-3 ${
                    venue.id === selectedVenueId
                      ? "border-[#80D160] bg-[#2C4930]"
                      : "border-[#3B4249] bg-[#292D32]"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      venue.id === selectedVenueId
                        ? "text-[#80D160]"
                        : "text-[#C5CBD1]"
                    }`}
                  >
                    {venue.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View className="mb-5 rounded-3xl border border-[#30363D] bg-[#202428] p-4">
            <Text className="mb-3 text-lg font-semibold text-white">
              Cancha
            </Text>
            {courtsLoading ? (
              <ActivityIndicator color="#80D160" />
            ) : courts.length === 0 ? (
              <Text className="text-sm text-[#A9B1B8]">
                Este complejo no tiene canchas activas.
              </Text>
            ) : (
              courts.map((court) => (
                <Pressable
                  key={court.id}
                  onPress={() => setSelectedCourtId(court.id)}
                  className={`mb-2 flex-row items-center rounded-xl border p-3 ${
                    court.id === selectedCourtId
                      ? "border-[#80D160] bg-[#2C4930]"
                      : "border-[#3B4249] bg-[#292D32]"
                  }`}
                >
                  <View className="flex-1">
                    <Text className="font-semibold text-white">
                      {court.name}
                    </Text>
                    <Text className="mt-1 text-xs text-[#A9B1B8]">
                      {court.slotMinutes} min ·{" "}
                      {formatAmount(court.pricePerSlot, court.currency)}
                    </Text>
                  </View>
                  {court.id === selectedCourtId && (
                    <Ionicons
                      name="checkmark-circle"
                      size={21}
                      color="#80D160"
                    />
                  )}
                </Pressable>
              ))
            )}
          </View>

          <View className="mb-5 rounded-3xl border border-[#30363D] bg-[#202428] p-4">
            <Text className="text-lg font-semibold text-white">
              Fecha y turno
            </Text>
            <Text className="mb-3 mt-1 text-xs text-[#8B949E]">
              Elegí una fecha rápida o ingresá otra fecha futura.
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickDates.map((date) => (
                <Pressable
                  key={date}
                  onPress={() => setSelectedDate(date)}
                  className={`mb-3 mr-2 rounded-xl border px-3 py-2.5 ${
                    date === selectedDate
                      ? "border-[#80D160] bg-[#2C4930]"
                      : "border-[#3B4249] bg-[#292D32]"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold capitalize ${
                      date === selectedDate
                        ? "text-[#80D160]"
                        : "text-[#A9B1B8]"
                    }`}
                  >
                    {dateLabel(date)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <FormField
              label="Fecha (AAAA-MM-DD)"
              value={selectedDate}
              onChangeText={setSelectedDate}
              keyboardType="numbers-and-punctuation"
              placeholder="2026-08-25"
            />
            {!validDateKey(selectedDate) || selectedDate < today ? (
              <Text className="mb-3 text-xs text-[#F08A93]">
                Ingresá una fecha válida que no sea anterior a hoy.
              </Text>
            ) : availabilityLoading ? (
              <View className="items-center py-4">
                <ActivityIndicator color="#80D160" />
                <Text className="mt-2 text-xs text-[#8B949E]">
                  Consultando disponibilidad real...
                </Text>
              </View>
            ) : availabilityError ? (
              <Text className="mb-3 text-center text-sm text-[#F08A93]">
                {availabilityError}
              </Text>
            ) : !availability?.slots?.length ? (
              <Text className="mb-3 text-sm text-[#A9B1B8]">
                No hay horarios configurados para esta fecha.
              </Text>
            ) : (
              <View className="flex-row flex-wrap">
                {availability.slots.map((slot) => (
                  <Pressable
                    key={slot.startsAt}
                    disabled={!slot.available}
                    onPress={() => setSelectedSlot(slot)}
                    className={`mb-2 mr-2 min-w-[88px] items-center rounded-xl border px-3 py-3 ${
                      selectedSlot?.startsAt === slot.startsAt
                        ? "border-[#80D160] bg-[#2C4930]"
                        : slot.available
                          ? "border-[#315C3B] bg-[#142019]"
                          : "border-[#30363D] bg-[#292D32]"
                    }`}
                  >
                    <Text
                      className={`font-bold ${
                        slot.available
                          ? "text-[#80D160]"
                          : "text-[#69727B] line-through"
                      }`}
                    >
                      {slotTime(slot.startsAt)}
                    </Text>
                    <Text className="mt-1 text-[10px] text-[#8B949E]">
                      {selectedSlot?.startsAt === slot.startsAt
                        ? "Elegido"
                        : slot.available
                          ? "Disponible"
                          : "Ocupado"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View className="mb-5 rounded-3xl border border-[#30363D] bg-[#202428] p-4">
            <Text className="mb-3 text-lg font-semibold text-white">
              Jugador
            </Text>
            <FormField
              label="Nombre completo"
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={161}
              placeholder="Persona que reservó"
            />
            <FormField
              label="Teléfono (opcional)"
              value={playerPhone}
              onChangeText={setPlayerPhone}
              keyboardType="phone-pad"
              maxLength={16}
              placeholder="+59899123456"
            />
            <FormField
              label="Observaciones (opcional)"
              value={notes}
              onChangeText={setNotes}
              maxLength={500}
              multiline
              textAlignVertical="top"
              placeholder="Ej.: reserva recibida por WhatsApp"
            />
          </View>

          <Pressable
            disabled={saving}
            onPress={confirmReservation}
            className={`items-center rounded-xl bg-[#80D160] py-4 ${
              saving ? "opacity-60" : ""
            }`}
          >
            {saving ? (
              <ActivityIndicator color="#152012" />
            ) : (
              <Text className="font-semibold text-[#152012]">
                Crear reserva manual
              </Text>
            )}
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
