import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { courtsApi, scheduleApi } from "../../../services/api";

const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function single(value) {
  return Array.isArray(value) ? value[0] : value;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  return new Date(`${value}T12:00:00`);
}

function dateLabel(value) {
  return parseDate(value).toLocaleDateString("es-UY", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function dateTimeLabel(value) {
  return new Date(value).toLocaleString("es-UY", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function validTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function offsetDateTime(date, time) {
  return `${date}T${time}:00-03:00`;
}

export default function ScheduleManagementScreen() {
  const params = useLocalSearchParams();
  const venueId = single(params.venueId);
  const venueName = single(params.venueName) ?? "Complejo";
  const router = useRouter();
  const dates = useMemo(() => {
    const start = new Date();
    start.setHours(12, 0, 0, 0);
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return dateKey(date);
    });
  }, []);

  const [courts, setCourts] = useState([]);
  const [hours, setHours] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [selectedCourtId, setSelectedCourtId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [opensAt, setOpensAt] = useState("08:00");
  const [closesAt, setClosesAt] = useState("23:00");
  const [blockDate, setBlockDate] = useState(dates[0]);
  const [blockStart, setBlockStart] = useState("18:00");
  const [blockEnd, setBlockEnd] = useState("19:00");
  const [blockReason, setBlockReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [savingHour, setSavingHour] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  const [error, setError] = useState("");

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [courtData, hourData] = await Promise.all([
        courtsApi.managedList(venueId),
        scheduleApi.hours(venueId),
      ]);
      setCourts(courtData);
      setHours(hourData);
      setSelectedCourtId((current) => current || courtData[0]?.id || "");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  const loadBlocks = useCallback(async () => {
    if (!selectedCourtId) {
      setBlocks([]);
      return;
    }
    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + 60);
    setLoadingBlocks(true);
    try {
      setBlocks(
        await scheduleApi.blocks(
          selectedCourtId,
          fromDate.toISOString(),
          toDate.toISOString(),
        ),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingBlocks(false);
    }
  }, [selectedCourtId]);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  async function addHour() {
    if (
      !validTime(opensAt) ||
      !validTime(closesAt) ||
      timeMinutes(closesAt) <= timeMinutes(opensAt)
    ) {
      Alert.alert(
        "Horario inválido",
        "Usá formato HH:mm y una hora de cierre posterior a la apertura.",
      );
      return;
    }
    try {
      setSavingHour(true);
      const created = await scheduleApi.addHour(venueId, {
        dayOfWeek,
        opensAt,
        closesAt,
      });
      setHours((current) =>
        [...current, created].sort(
          (a, b) =>
            Number(a.dayOfWeek) - Number(b.dayOfWeek) ||
            a.opensAt.localeCompare(b.opensAt),
        ),
      );
    } catch (requestError) {
      Alert.alert("No se pudo agregar", requestError.message);
    } finally {
      setSavingHour(false);
    }
  }

  function removeHour(hour) {
    Alert.alert(
      "Eliminar franja",
      `${DAYS[Number(hour.dayOfWeek) - 1]} de ${hour.opensAt.slice(0, 5)} a ${hour.closesAt.slice(0, 5)}.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await scheduleApi.deleteHour(hour.id);
              setHours((current) =>
                current.filter((item) => item.id !== hour.id),
              );
            } catch (requestError) {
              Alert.alert("No se pudo eliminar", requestError.message);
            }
          },
        },
      ],
    );
  }

  async function addBlock() {
    if (!selectedCourtId) {
      Alert.alert("Falta una cancha", "Creá o seleccioná una cancha primero.");
      return;
    }
    if (
      !validTime(blockStart) ||
      !validTime(blockEnd) ||
      timeMinutes(blockEnd) <= timeMinutes(blockStart)
    ) {
      Alert.alert("Horario inválido", "Revisá el inicio y el fin del bloqueo.");
      return;
    }
    if (blockReason.trim().length < 2) {
      Alert.alert("Falta el motivo", "Indicá brevemente por qué se bloquea.");
      return;
    }

    try {
      setSavingBlock(true);
      const created = await scheduleApi.addBlock(selectedCourtId, {
        startsAt: offsetDateTime(blockDate, blockStart),
        endsAt: offsetDateTime(blockDate, blockEnd),
        reason: blockReason.trim(),
      });
      setBlocks((current) =>
        [...current, created].sort((a, b) =>
          a.startsAt.localeCompare(b.startsAt),
        ),
      );
      setBlockReason("");
      Alert.alert(
        "Bloqueo creado",
        "Ese período ya no aparecerá como disponible para reservar.",
      );
    } catch (requestError) {
      Alert.alert("No se pudo bloquear", requestError.message);
    } finally {
      setSavingBlock(false);
    }
  }

  function removeBlock(block) {
    Alert.alert("Quitar bloqueo", block.reason, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Quitar",
        style: "destructive",
        onPress: async () => {
          try {
            await scheduleApi.deleteBlock(block.id);
            setBlocks((current) =>
              current.filter((item) => item.id !== block.id),
            );
          } catch (requestError) {
            Alert.alert("No se pudo quitar", requestError.message);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#17191C" }}
      edges={["top"]}
    >
      <View className="flex-row items-center px-5 pb-4 pt-3">
        <Pressable
          onPress={() => router.back()}
          className="mr-4 h-11 w-11 items-center justify-center rounded-xl border border-[#30363D] bg-[#202428]"
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-white">
            Horarios y bloqueos
          </Text>
          <Text className="mt-0.5 text-sm text-[#8B949E]">{venueName}</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#80D160" size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled"
        >
          {!!error && (
            <View className="mb-5 rounded-2xl border border-[#653B40] bg-[#2B2225] p-4">
              <Text className="text-[#F08A93]">{error}</Text>
            </View>
          )}

          <View className="mb-5 rounded-3xl border border-[#30363D] bg-[#202428] p-4">
            <Text className="text-lg font-semibold text-white">
              Horario semanal
            </Text>
            <Text className="mb-4 mt-1 text-xs leading-5 text-[#8B949E]">
              Estas franjas aplican a todas las canchas del complejo. Podés
              tener varias por día, siempre que no se superpongan.
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              {DAYS.map((day, index) => (
                <Pressable
                  key={day}
                  onPress={() => setDayOfWeek(index + 1)}
                  className={`mr-2 rounded-xl border px-4 py-3 ${
                    dayOfWeek === index + 1
                      ? "border-[#80D160] bg-[#2C4930]"
                      : "border-[#3B4249] bg-[#292D32]"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      dayOfWeek === index + 1
                        ? "text-[#80D160]"
                        : "text-[#A9B1B8]"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-2 text-xs text-[#A9B1B8]">Abre</Text>
                <TextInput
                  value={opensAt}
                  onChangeText={setOpensAt}
                  placeholder="08:00"
                  placeholderTextColor="#69727B"
                  className="h-12 rounded-xl border border-[#30363D] bg-[#17191C] px-4 text-white"
                />
              </View>
              <View className="flex-1">
                <Text className="mb-2 text-xs text-[#A9B1B8]">Cierra</Text>
                <TextInput
                  value={closesAt}
                  onChangeText={setClosesAt}
                  placeholder="23:00"
                  placeholderTextColor="#69727B"
                  className="h-12 rounded-xl border border-[#30363D] bg-[#17191C] px-4 text-white"
                />
              </View>
            </View>
            <Pressable
              disabled={savingHour}
              onPress={addHour}
              className="mt-4 items-center rounded-xl bg-[#80D160] py-3.5"
            >
              <Text className="font-semibold text-[#152012]">
                {savingHour ? "Agregando..." : "Agregar franja"}
              </Text>
            </Pressable>

            <View className="mt-5 border-t border-[#30363D] pt-4">
              {hours.length === 0 ? (
                <Text className="text-sm text-[#8B949E]">
                  Todavía no hay horarios configurados.
                </Text>
              ) : (
                hours.map((hour) => (
                  <View
                    key={hour.id}
                    className="mb-2 flex-row items-center rounded-xl bg-[#292D32] p-3"
                  >
                    <View className="flex-1">
                      <Text className="font-semibold text-white">
                        {DAYS[Number(hour.dayOfWeek) - 1]}
                      </Text>
                      <Text className="mt-1 text-sm text-[#A9B1B8]">
                        {hour.opensAt.slice(0, 5)} – {hour.closesAt.slice(0, 5)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => removeHour(hour)}
                      className="h-10 w-10 items-center justify-center rounded-lg bg-[#2B2225]"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={19}
                        color="#F08A93"
                      />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>

          <View className="rounded-3xl border border-[#30363D] bg-[#202428] p-4">
            <Text className="text-lg font-semibold text-white">
              Bloqueos puntuales
            </Text>
            <Text className="mb-4 mt-1 text-xs leading-5 text-[#8B949E]">
              Para mantenimiento, eventos o cualquier período no reservable.
            </Text>

            {courts.length === 0 ? (
              <Text className="text-sm text-[#F4C95D]">
                Creá una cancha antes de configurar bloqueos.
              </Text>
            ) : (
              <>
                <Text className="mb-2 text-xs text-[#A9B1B8]">Cancha</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-4"
                >
                  {courts.map((court) => (
                    <Pressable
                      key={court.id}
                      onPress={() => setSelectedCourtId(court.id)}
                      className={`mr-2 rounded-xl border px-4 py-3 ${
                        selectedCourtId === court.id
                          ? "border-[#80D160] bg-[#2C4930]"
                          : "border-[#3B4249] bg-[#292D32]"
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          selectedCourtId === court.id
                            ? "text-[#80D160]"
                            : "text-[#A9B1B8]"
                        }`}
                      >
                        {court.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text className="mb-2 text-xs text-[#A9B1B8]">Fecha</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-4"
                >
                  {dates.map((date) => (
                    <Pressable
                      key={date}
                      onPress={() => setBlockDate(date)}
                      className={`mr-2 rounded-xl border px-4 py-3 ${
                        blockDate === date
                          ? "border-[#80D160] bg-[#2C4930]"
                          : "border-[#3B4249] bg-[#292D32]"
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          blockDate === date
                            ? "text-[#80D160]"
                            : "text-[#A9B1B8]"
                        }`}
                      >
                        {dateLabel(date)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="mb-2 text-xs text-[#A9B1B8]">Inicio</Text>
                    <TextInput
                      value={blockStart}
                      onChangeText={setBlockStart}
                      className="h-12 rounded-xl border border-[#30363D] bg-[#17191C] px-4 text-white"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="mb-2 text-xs text-[#A9B1B8]">Fin</Text>
                    <TextInput
                      value={blockEnd}
                      onChangeText={setBlockEnd}
                      className="h-12 rounded-xl border border-[#30363D] bg-[#17191C] px-4 text-white"
                    />
                  </View>
                </View>
                <Text className="mb-2 mt-4 text-xs text-[#A9B1B8]">Motivo</Text>
                <TextInput
                  value={blockReason}
                  onChangeText={setBlockReason}
                  placeholder="Ej.: mantenimiento"
                  placeholderTextColor="#69727B"
                  className="h-12 rounded-xl border border-[#30363D] bg-[#17191C] px-4 text-white"
                />
                <Pressable
                  disabled={savingBlock}
                  onPress={addBlock}
                  className="mt-4 items-center rounded-xl border border-[#F4C95D] bg-[#2A2517] py-3.5"
                >
                  <Text className="font-semibold text-[#F4C95D]">
                    {savingBlock ? "Bloqueando..." : "Crear bloqueo"}
                  </Text>
                </Pressable>

                <View className="mt-5 border-t border-[#30363D] pt-4">
                  {loadingBlocks ? (
                    <ActivityIndicator color="#80D160" />
                  ) : blocks.length === 0 ? (
                    <Text className="text-sm text-[#8B949E]">
                      Esta cancha no tiene bloqueos próximos.
                    </Text>
                  ) : (
                    blocks.map((block) => (
                      <View
                        key={block.id}
                        className="mb-2 flex-row items-center rounded-xl bg-[#292D32] p-3"
                      >
                        <View className="flex-1 pr-3">
                          <Text className="font-semibold text-white">
                            {block.reason}
                          </Text>
                          <Text className="mt-1 text-xs leading-5 text-[#A9B1B8]">
                            {dateTimeLabel(block.startsAt)} – {"\n"}
                            {dateTimeLabel(block.endsAt)}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => removeBlock(block)}
                          className="h-10 w-10 items-center justify-center rounded-lg bg-[#2B2225]"
                        >
                          <Ionicons
                            name="trash-outline"
                            size={19}
                            color="#F08A93"
                          />
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
