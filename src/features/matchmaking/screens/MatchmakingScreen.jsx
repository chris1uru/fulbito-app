import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAlert } from "../../../components/common/AppAlert";
import { useAuth } from "../../../providers/AuthProvider";
import { matchRequestsApi, reservationsApi } from "../../../services/api";
import {
  addUruguayDays,
  formatUruguayCalendarDate,
  formatUruguayDate,
  formatUruguayTime,
  uruguayDateKey,
  uruguayDateTimeIso,
  uruguayDayRange,
} from "../../../utils/uruguayDateTime";

const STYLE_OPTIONS = [
  { value: "ALL", label: "Todos", icon: "apps-outline" },
  { value: "RECREATIONAL", label: "Recreacional", icon: "happy-outline" },
  { value: "COMPETITIVE", label: "Competitivo", icon: "trophy-outline" },
];
const FORMAT_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "FIVE", label: "Fútbol 5" },
  { value: "SEVEN", label: "Fútbol 7" },
  { value: "ELEVEN", label: "Fútbol 11" },
];
const DATE_OPTIONS = [
  { value: "ALL", label: "Cualquier día" },
  { value: "TODAY", label: "Hoy" },
  { value: "WEEK", label: "Próximos 7 días" },
  { value: "MONTH", label: "Próximos 30 días" },
];
const START_TIMES = Array.from(
  { length: 15 },
  (_, index) => `${String(index + 8).padStart(2, "0")}:00`,
);
const END_TIMES = Array.from(
  { length: 15 },
  (_, index) => `${String(index + 9).padStart(2, "0")}:00`,
);

const FORMAT_LABELS = {
  FIVE: "Fútbol 5",
  SEVEN: "Fútbol 7",
  ELEVEN: "Fútbol 11",
};
const STATUS_LABELS = {
  OPEN: "Abierta",
  CLOSED: "Cerrada",
  CANCELLED: "Cancelada",
  EXPIRED: "Vencida",
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

function StyleSelector({ value, onChange, includeAll = true }) {
  const options = includeAll
    ? STYLE_OPTIONS
    : STYLE_OPTIONS.filter((option) => option.value !== "ALL");
  return (
    <View className="flex-row gap-2">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            className={`min-h-12 flex-1 flex-row items-center justify-center rounded-xl border px-2 ${
              active
                ? "border-[#80D160] bg-[#2C4930]"
                : "border-[#30363D] bg-[#202428]"
            }`}
          >
            <Ionicons
              name={option.icon}
              size={17}
              color={active ? "#80D160" : "#8B949E"}
            />
            <Text
              numberOfLines={1}
              className={`ml-1.5 text-xs font-semibold ${
                active ? "text-[#80D160]" : "text-[#A9B1B8]"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function DateTimeLine({ startsAt, endsAt }) {
  return (
    <View className="mt-2 flex-row items-center">
      <Ionicons name="time-outline" size={17} color="#80D160" />
      <Text className="ml-2 flex-1 text-sm text-[#C5CBD1]">
        {formatUruguayDate(startsAt, {
          weekday: "short",
          day: "2-digit",
          month: "short",
        })}
        {" · "}
        {formatUruguayTime(startsAt)}–{formatUruguayTime(endsAt)}
      </Text>
    </View>
  );
}

function MatchCard({ item, mine, busy, onInterest, onClose, onViewInterests }) {
  const open = item.status === "OPEN";
  const styleLabel =
    item.style === "COMPETITIVE" ? "Competitivo" : "Recreacional";
  return (
    <View className="mb-3 rounded-3xl border border-[#30363D] bg-[#202428] p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-lg font-bold text-white">
            {item.creatorName}
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            <View
              className={`rounded-full px-2.5 py-1 ${
                item.style === "COMPETITIVE" ? "bg-[#473C24]" : "bg-[#2C4930]"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  item.style === "COMPETITIVE"
                    ? "text-[#F2C96D]"
                    : "text-[#80D160]"
                }`}
              >
                {styleLabel}
              </Text>
            </View>
            <View className="rounded-full bg-[#292D32] px-2.5 py-1">
              <Text className="text-xs font-semibold text-[#C5CBD1]">
                {FORMAT_LABELS[item.footballFormat]}
              </Text>
            </View>
            {mine && (
              <View className="rounded-full bg-[#292D32] px-2.5 py-1">
                <Text className="text-xs font-semibold text-[#A9B1B8]">
                  {STATUS_LABELS[item.status] ?? item.status}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#292D32]">
          <Ionicons
            name={item.reservationId ? "location-outline" : "calendar-outline"}
            size={21}
            color="#80D160"
          />
        </View>
      </View>

      {item.reservationId ? (
        <View className="mt-4 rounded-2xl border border-[#315C3B] bg-[#1B2920] p-3">
          <Text className="text-xs font-semibold uppercase tracking-widest text-[#80D160]">
            Cancha reservada
          </Text>
          <Text className="mt-1 font-semibold text-white">
            {item.venueName} · {item.courtName}
          </Text>
          <DateTimeLine
            startsAt={item.reservedStartsAt}
            endsAt={item.reservedEndsAt}
          />
        </View>
      ) : (
        <View className="mt-4 rounded-2xl bg-[#292D32] p-3">
          <Text className="text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
            Horarios posibles
          </Text>
          {item.availabilities.map((window) => (
            <DateTimeLine
              key={window.id}
              startsAt={window.startsAt}
              endsAt={window.endsAt}
            />
          ))}
        </View>
      )}

      {!!item.notes && (
        <Text className="mt-3 text-sm leading-5 text-[#A9B1B8]">
          {item.notes}
        </Text>
      )}

      {mine ? (
        <View className="mt-4 flex-row gap-2">
          <Pressable
            onPress={() => onViewInterests(item)}
            className="min-h-11 flex-1 flex-row items-center justify-center rounded-xl bg-[#2C4930] px-3"
          >
            <Ionicons name="people-outline" size={18} color="#80D160" />
            <Text className="ml-2 font-semibold text-[#80D160]">
              {item.interestCount} interesado
              {item.interestCount === 1 ? "" : "s"}
            </Text>
          </Pressable>
          {open && (
            <Pressable
              disabled={busy}
              onPress={() => onClose(item)}
              className="min-h-11 items-center justify-center rounded-xl border border-[#653B40] bg-[#2B2225] px-4"
            >
              {busy ? (
                <ActivityIndicator color="#F08A93" />
              ) : (
                <Text className="font-semibold text-[#F08A93]">Cerrar</Text>
              )}
            </Pressable>
          )}
        </View>
      ) : (
        <Pressable
          disabled={item.interested || busy}
          onPress={() => onInterest(item)}
          className={`mt-4 min-h-12 flex-row items-center justify-center rounded-xl ${
            item.interested ? "bg-[#292D32]" : "bg-[#80D160]"
          }`}
        >
          {busy ? (
            <ActivityIndicator color="#152012" />
          ) : (
            <>
              <Ionicons
                name={item.interested ? "checkmark-circle" : "football-outline"}
                size={20}
                color={item.interested ? "#80D160" : "#152012"}
              />
              <Text
                className={`ml-2 font-bold ${
                  item.interested ? "text-[#80D160]" : "text-[#152012]"
                }`}
              >
                {item.interested
                  ? "Ya dijiste que querés jugar"
                  : "Quiero jugar"}
              </Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

function ChoiceCard({ active, icon, title, detail, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-2 flex-row items-center rounded-2xl border p-4 ${
        active
          ? "border-[#80D160] bg-[#2C4930]"
          : "border-[#30363D] bg-[#292D32]"
      }`}
    >
      <Ionicons name={icon} size={22} color={active ? "#80D160" : "#8B949E"} />
      <View className="ml-3 flex-1">
        <Text
          className={`font-semibold ${active ? "text-white" : "text-[#C5CBD1]"}`}
        >
          {title}
        </Text>
        <Text className="mt-0.5 text-xs text-[#8B949E]">{detail}</Text>
      </View>
      {active && <Ionicons name="checkmark-circle" size={21} color="#80D160" />}
    </Pressable>
  );
}

function CreateMatchModal({ visible, reservations, onClose, onCreated }) {
  const { top, bottom } = useSafeAreaInsets();
  const [style, setStyle] = useState("RECREATIONAL");
  const [source, setSource] = useState("AVAILABILITY");
  const [format, setFormat] = useState("FIVE");
  const [reservationId, setReservationId] = useState(null);
  const [date, setDate] = useState(() => addUruguayDays(uruguayDateKey(), 1));
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("22:00");
  const [windows, setWindows] = useState([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const dates = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) =>
        addUruguayDays(uruguayDateKey(), index + 1),
      ),
    [],
  );
  const futureReservations = useMemo(
    () =>
      reservations
        .filter(
          (item) =>
            item.status === "CONFIRMED" &&
            new Date(item.startsAt).getTime() > Date.now(),
        )
        .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)),
    [reservations],
  );
  const selectedReservation = futureReservations.find(
    (item) => item.id === reservationId,
  );

  useEffect(() => {
    if (!visible) return;
    setStyle("RECREATIONAL");
    setSource("AVAILABILITY");
    setFormat("FIVE");
    setReservationId(null);
    setDate(addUruguayDays(uruguayDateKey(), 1));
    setStartTime("18:00");
    setEndTime("22:00");
    setWindows([]);
    setNotes("");
    setSaving(false);
  }, [visible]);

  function addWindow() {
    const startsAt = uruguayDateTimeIso(date, startTime);
    const endsAt = uruguayDateTimeIso(date, endTime);
    if (new Date(endsAt) <= new Date(startsAt)) {
      AppAlert.alert(
        "Horario inválido",
        "La hora de fin debe ser posterior a la de inicio.",
      );
      return;
    }
    const overlaps = windows.some(
      (window) =>
        new Date(window.endsAt) > new Date(startsAt) &&
        new Date(window.startsAt) < new Date(endsAt),
    );
    if (overlaps) {
      AppAlert.alert(
        "Horario repetido",
        "La nueva franja se superpone con otra que ya agregaste.",
      );
      return;
    }
    if (windows.length >= 6) {
      AppAlert.alert(
        "Máximo alcanzado",
        "Podés publicar hasta seis franjas disponibles.",
      );
      return;
    }
    setWindows((current) =>
      [...current, { startsAt, endsAt }].sort(
        (a, b) => new Date(a.startsAt) - new Date(b.startsAt),
      ),
    );
  }

  async function submit() {
    if (source === "RESERVATION" && !selectedReservation) {
      AppAlert.alert(
        "Elegí una reserva",
        "Seleccioná la cancha que ya tenés reservada.",
      );
      return;
    }
    if (source === "AVAILABILITY" && windows.length === 0) {
      AppAlert.alert(
        "Agregá un horario",
        "Indicá al menos un día y una franja disponible.",
      );
      return;
    }
    setSaving(true);
    try {
      await matchRequestsApi.create({
        style,
        footballFormat: selectedReservation?.footballFormat ?? format,
        reservationId: source === "RESERVATION" ? reservationId : null,
        availabilities: source === "AVAILABILITY" ? windows : [],
        notes: notes.trim() || null,
      });
      onCreated();
      onClose();
      AppAlert.alert(
        "Búsqueda publicada",
        "Tu publicación ya está visible para otros jugadores.",
      );
    } catch (error) {
      AppAlert.alert("No se pudo publicar", error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#17191C]" style={{ paddingTop: top }}>
        <View className="flex-row items-center justify-between border-b border-[#30363D] px-4 py-4">
          <View>
            <Text className="text-2xl font-bold text-white">
              Publicar búsqueda
            </Text>
            <Text className="mt-1 text-xs text-[#8B949E]">
              Encontrá un equipo para jugar
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="h-11 w-11 items-center justify-center rounded-xl bg-[#292D32]"
          >
            <Ionicons name="close" size={24} color="#C5CBD1" />
          </Pressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: bottom + 30 }}
        >
          <Text className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
            Cómo quieren jugar
          </Text>
          <StyleSelector value={style} onChange={setStyle} includeAll={false} />

          <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
            ¿Ya tenés cancha?
          </Text>
          <ChoiceCard
            active={source === "RESERVATION"}
            icon="location-outline"
            title="Sí, ya está reservada"
            detail="Publicar una de tus próximas reservas"
            onPress={() => setSource("RESERVATION")}
          />
          <ChoiceCard
            active={source === "AVAILABILITY"}
            icon="calendar-outline"
            title="Todavía no"
            detail="Proponer días y horarios para coordinar"
            onPress={() => setSource("AVAILABILITY")}
          />

          {source === "RESERVATION" ? (
            <View className="mt-4">
              {futureReservations.length === 0 ? (
                <View className="rounded-2xl border border-dashed border-[#3B4249] bg-[#202428] p-5">
                  <Text className="text-center text-sm text-[#A9B1B8]">
                    No tenés reservas futuras confirmadas.
                  </Text>
                </View>
              ) : (
                futureReservations.map((reservation) => (
                  <Pressable
                    key={reservation.id}
                    onPress={() => setReservationId(reservation.id)}
                    className={`mb-2 rounded-2xl border p-4 ${
                      reservationId === reservation.id
                        ? "border-[#80D160] bg-[#2C4930]"
                        : "border-[#30363D] bg-[#202428]"
                    }`}
                  >
                    <Text className="font-semibold text-white">
                      {reservation.venueName} · {reservation.courtName}
                    </Text>
                    <DateTimeLine
                      startsAt={reservation.startsAt}
                      endsAt={reservation.endsAt}
                    />
                  </Pressable>
                ))
              )}
            </View>
          ) : (
            <>
              <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
                Formato
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {FORMAT_OPTIONS.filter((option) => option.value !== "ALL").map(
                  (option) => (
                    <FilterChip
                      key={option.value}
                      active={format === option.value}
                      label={option.label}
                      onPress={() => setFormat(option.value)}
                    />
                  ),
                )}
              </View>

              <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
                Día
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2 pr-4">
                  {dates.map((dateKey) => (
                    <FilterChip
                      key={dateKey}
                      active={date === dateKey}
                      label={formatUruguayCalendarDate(dateKey, {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}
                      onPress={() => setDate(dateKey)}
                    />
                  ))}
                </View>
              </ScrollView>

              <Text className="mb-2 mt-5 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
                Desde
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2 pr-4">
                  {START_TIMES.map((time) => (
                    <FilterChip
                      key={time}
                      active={startTime === time}
                      label={time}
                      onPress={() => setStartTime(time)}
                    />
                  ))}
                </View>
              </ScrollView>

              <Text className="mb-2 mt-5 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
                Hasta
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2 pr-4">
                  {END_TIMES.map((time) => (
                    <FilterChip
                      key={time}
                      active={endTime === time}
                      label={time}
                      onPress={() => setEndTime(time)}
                    />
                  ))}
                </View>
              </ScrollView>

              <Pressable
                onPress={addWindow}
                className="mt-4 min-h-11 flex-row items-center justify-center rounded-xl border border-[#315C3B] bg-[#1B2920]"
              >
                <Ionicons name="add-circle-outline" size={20} color="#80D160" />
                <Text className="ml-2 font-semibold text-[#80D160]">
                  Agregar esta franja
                </Text>
              </Pressable>

              {windows.map((window, index) => (
                <View
                  key={`${window.startsAt}-${window.endsAt}`}
                  className="mt-2 flex-row items-center rounded-xl bg-[#292D32] p-3"
                >
                  <View className="flex-1">
                    <DateTimeLine
                      startsAt={window.startsAt}
                      endsAt={window.endsAt}
                    />
                  </View>
                  <Pressable
                    onPress={() =>
                      setWindows((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="h-9 w-9 items-center justify-center rounded-lg bg-[#2B2225]"
                  >
                    <Ionicons name="trash-outline" size={18} color="#F08A93" />
                  </Pressable>
                </View>
              ))}
            </>
          )}

          <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
            Comentario opcional
          </Text>
          <TextInput
            multiline
            maxLength={500}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ej.: somos un equipo tranquilo, buscamos jugar una hora..."
            placeholderTextColor="#69727B"
            className="min-h-28 rounded-2xl border border-[#30363D] bg-[#202428] p-4 text-white"
            style={{ textAlignVertical: "top" }}
          />
          <Text className="mt-1 text-right text-xs text-[#69727B]">
            {notes.length}/500
          </Text>

          <Pressable
            disabled={saving}
            onPress={submit}
            className="mt-6 min-h-14 flex-row items-center justify-center rounded-2xl bg-[#80D160]"
          >
            {saving ? (
              <ActivityIndicator color="#152012" />
            ) : (
              <>
                <Ionicons name="megaphone-outline" size={21} color="#152012" />
                <Text className="ml-2 text-base font-bold text-[#152012]">
                  Publicar búsqueda
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function InterestsModal({ request, onClose }) {
  const { top, bottom } = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!request) return;
    let active = true;
    setLoading(true);
    setError("");
    matchRequestsApi
      .interests(request.id)
      .then((data) => active && setItems(data))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [request]);

  function openWhatsApp(phone) {
    Linking.openURL(`https://wa.me/${phone.replace(/\D/g, "")}`).catch(() =>
      AppAlert.alert(
        "No se pudo abrir WhatsApp",
        "Podés copiar o llamar al número mostrado.",
      ),
    );
  }

  return (
    <Modal visible={!!request} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#17191C]" style={{ paddingTop: top }}>
        <View className="flex-row items-center justify-between border-b border-[#30363D] px-4 py-4">
          <View>
            <Text className="text-2xl font-bold text-white">Interesados</Text>
            <Text className="mt-1 text-xs text-[#8B949E]">
              Contactalos para coordinar el partido
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="h-11 w-11 items-center justify-center rounded-xl bg-[#292D32]"
          >
            <Ionicons name="close" size={24} color="#C5CBD1" />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: bottom + 20 }}
        >
          {loading ? (
            <ActivityIndicator color="#80D160" size="large" />
          ) : error ? (
            <Text className="text-center text-[#F08A93]">{error}</Text>
          ) : items.length === 0 ? (
            <View className="items-center rounded-3xl border border-dashed border-[#3B4249] bg-[#202428] px-6 py-12">
              <Ionicons name="people-outline" size={34} color="#69727B" />
              <Text className="mt-3 text-center text-[#A9B1B8]">
                Todavía nadie indicó que quiere jugar.
              </Text>
            </View>
          ) : (
            items.map((item) => (
              <View
                key={item.id}
                className="mb-3 rounded-2xl border border-[#30363D] bg-[#202428] p-4"
              >
                <Text className="text-lg font-semibold text-white">
                  {item.playerName}
                </Text>
                <Text className="mt-1 text-sm text-[#80D160]">
                  {item.playerPhone}
                </Text>
                <View className="mt-4 flex-row gap-2">
                  <Pressable
                    onPress={() => openWhatsApp(item.playerPhone)}
                    className="min-h-11 flex-1 flex-row items-center justify-center rounded-xl bg-[#2C4930]"
                  >
                    <Ionicons name="logo-whatsapp" size={19} color="#80D160" />
                    <Text className="ml-2 font-semibold text-[#80D160]">
                      WhatsApp
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${item.playerPhone}`)}
                    className="min-h-11 flex-1 flex-row items-center justify-center rounded-xl bg-[#292D32]"
                  >
                    <Ionicons name="call-outline" size={19} color="#C5CBD1" />
                    <Text className="ml-2 font-semibold text-[#C5CBD1]">
                      Llamar
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function filterDateRange(value) {
  if (value === "ALL") return {};
  const today = uruguayDateKey();
  if (value === "TODAY") return uruguayDayRange(today);
  const days = value === "WEEK" ? 7 : 30;
  return {
    from: uruguayDayRange(today).from,
    to: uruguayDayRange(addUruguayDays(today, days)).from,
  };
}

export default function MatchmakingScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { user } = useAuth();
  const [view, setView] = useState("DISCOVER");
  const [style, setStyle] = useState("ALL");
  const [format, setFormat] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [items, setItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [interestRequest, setInterestRequest] = useState(null);

  const load = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const range = filterDateRange(dateFilter);
        const [requests, reservationData] = await Promise.all([
          view === "MINE"
            ? matchRequestsApi.mine()
            : matchRequestsApi.discover({ style, format, ...range }),
          reservationsApi.mine(),
        ]);
        setItems(
          view === "MINE"
            ? requests.filter(
                (item) =>
                  (style === "ALL" || item.style === style) &&
                  (format === "ALL" || item.footballFormat === format),
              )
            : requests,
        );
        setReservations(reservationData);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateFilter, format, style, view],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function requirePhone(action) {
    if (user?.phone) {
      action();
      return;
    }
    AppAlert.alert(
      "Agregá tu teléfono",
      "Buscar rival usa tu número para que los equipos puedan coordinar en privado.",
      [
        { text: "Ahora no", style: "cancel" },
        { text: "Editar perfil", onPress: () => router.push("/profileEdit") },
      ],
    );
  }

  function expressInterest(item) {
    requirePhone(() =>
      AppAlert.alert(
        "¿Querés jugar?",
        `Al confirmar, ${item.creatorName} podrá ver tu nombre y el teléfono asociado a tu cuenta.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Quiero jugar",
            onPress: async () => {
              setBusyId(item.id);
              try {
                await matchRequestsApi.expressInterest(item.id);
                setItems((current) =>
                  current.map((value) =>
                    value.id === item.id
                      ? { ...value, interested: true }
                      : value,
                  ),
                );
                AppAlert.alert(
                  "¡Listo!",
                  "Tu teléfono ya está disponible para el creador de la búsqueda.",
                );
              } catch (requestError) {
                AppAlert.alert("No se pudo confirmar", requestError.message);
              } finally {
                setBusyId(null);
              }
            },
          },
        ],
      ),
    );
  }

  function closeRequest(item) {
    AppAlert.alert(
      "Cerrar búsqueda",
      "La publicación dejará de aparecer para otros jugadores.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar búsqueda",
          style: "destructive",
          onPress: async () => {
            setBusyId(item.id);
            try {
              const updated = await matchRequestsApi.close(item.id);
              setItems((current) =>
                current.map((value) =>
                  value.id === item.id ? updated : value,
                ),
              );
            } catch (requestError) {
              AppAlert.alert("No se pudo cerrar", requestError.message);
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  }

  return (
    <View className="flex-1 bg-[#17191C]" style={{ paddingTop: top + 5 }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load({ refresh: true })}
            tintColor="#80D160"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom + 90 }}
      >
        <View className="px-4 pb-4 pt-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-3xl font-semibold text-white">
                Buscar rival
              </Text>
              <Text className="mt-1 text-sm text-[#A9B1B8]">
                Encontrá otro equipo para jugar
              </Text>
            </View>
            <Pressable
              onPress={() => requirePhone(() => setCreateVisible(true))}
              className="h-12 w-12 items-center justify-center rounded-xl bg-[#80D160]"
              accessibilityLabel="Publicar búsqueda"
            >
              <Ionicons name="add" size={27} color="#152012" />
            </Pressable>
          </View>

          <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
            Estilo de partido
          </Text>
          <StyleSelector value={style} onChange={setStyle} />

          <View className="mt-4 flex-row rounded-xl bg-[#202428] p-1">
            {[
              ["DISCOVER", "Explorar"],
              ["MINE", "Mis publicaciones"],
            ].map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => setView(value)}
                className={`min-h-10 flex-1 items-center justify-center rounded-lg ${
                  view === value ? "bg-[#2C4930]" : ""
                }`}
              >
                <Text
                  className={`font-semibold ${view === value ? "text-[#80D160]" : "text-[#8B949E]"}`}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mx-4 mb-4 overflow-hidden rounded-2xl border border-[#30363D] bg-[#202428]">
          <Pressable
            onPress={() => setFiltersExpanded((current) => !current)}
            className="flex-row items-center justify-between px-4 py-4"
            accessibilityState={{ expanded: filtersExpanded }}
          >
            <View className="flex-row items-center">
              <Ionicons name="options-outline" size={19} color="#80D160" />
              <Text className="ml-2 font-semibold text-white">Más filtros</Text>
            </View>
            <Ionicons
              name={filtersExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#A9B1B8"
            />
          </Pressable>
          {filtersExpanded && (
            <View className="border-t border-[#30363D] px-4 pb-4">
              <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-widest text-[#69727B]">
                Formato
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {FORMAT_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.value}
                    active={format === option.value}
                    label={option.label}
                    onPress={() => setFormat(option.value)}
                  />
                ))}
              </View>
              {view === "DISCOVER" && (
                <>
                  <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-widest text-[#69727B]">
                    Fecha
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {DATE_OPTIONS.map((option) => (
                      <FilterChip
                        key={option.value}
                        active={dateFilter === option.value}
                        label={option.label}
                        onPress={() => setDateFilter(option.value)}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        <View className="px-4">
          {loading ? (
            <View className="h-48 items-center justify-center">
              <ActivityIndicator color="#80D160" size="large" />
              <Text className="mt-3 text-sm text-[#A9B1B8]">
                Buscando equipos...
              </Text>
            </View>
          ) : error ? (
            <View className="items-center rounded-3xl border border-[#653B40] bg-[#2B2225] px-6 py-8">
              <Ionicons
                name="cloud-offline-outline"
                size={34}
                color="#F08A93"
              />
              <Text className="mt-3 text-center text-sm text-[#F08A93]">
                {error}
              </Text>
              <Pressable
                onPress={() => load()}
                className="mt-4 rounded-xl bg-[#3A292D] px-5 py-3"
              >
                <Text className="font-semibold text-[#F08A93]">Reintentar</Text>
              </Pressable>
            </View>
          ) : items.length === 0 ? (
            <View className="items-center rounded-3xl border border-dashed border-[#3B4249] bg-[#202428] px-6 py-12">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#2C4930]">
                <Ionicons name="people-outline" size={29} color="#80D160" />
              </View>
              <Text className="mt-4 text-center text-lg font-semibold text-white">
                {view === "MINE"
                  ? "Todavía no publicaste búsquedas"
                  : "No hay equipos con estos filtros"}
              </Text>
              <Text className="mt-2 text-center text-sm leading-5 text-[#8B949E]">
                {view === "MINE"
                  ? "Publicá tus horarios y encontrá un rival."
                  : "Probá cambiar los filtros o publicá tu propia búsqueda."}
              </Text>
              <Pressable
                onPress={() => requirePhone(() => setCreateVisible(true))}
                className="mt-5 min-h-11 flex-row items-center justify-center rounded-xl bg-[#80D160] px-5"
              >
                <Ionicons name="add" size={20} color="#152012" />
                <Text className="ml-1 font-bold text-[#152012]">
                  Publicar búsqueda
                </Text>
              </Pressable>
            </View>
          ) : (
            items.map((item) => (
              <MatchCard
                key={item.id}
                item={item}
                mine={view === "MINE"}
                busy={busyId === item.id}
                onInterest={expressInterest}
                onClose={closeRequest}
                onViewInterests={setInterestRequest}
              />
            ))
          )}
        </View>
      </ScrollView>

      <CreateMatchModal
        visible={createVisible}
        reservations={reservations}
        onClose={() => setCreateVisible(false)}
        onCreated={() => {
          setView("MINE");
          load();
        }}
      />
      <InterestsModal
        request={interestRequest}
        onClose={() => setInterestRequest(null)}
      />
    </View>
  );
}
