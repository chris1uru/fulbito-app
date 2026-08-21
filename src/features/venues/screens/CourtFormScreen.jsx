import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { courtsApi } from "../../../services/api";

const FORMATS = [
  ["FIVE", "Fútbol 5"],
  ["SEVEN", "Fútbol 7"],
  ["ELEVEN", "Fútbol 11"],
];

const SURFACES = [
  ["SYNTHETIC_GRASS", "Sintético"],
  ["NATURAL_GRASS", "Natural"],
  ["INDOOR", "Interior"],
  ["CONCRETE", "Hormigón"],
  ["OTHER", "Otra"],
];

const DURATIONS = [60, 75, 90, 105, 120];

const EMPTY = {
  name: "",
  footballFormat: "FIVE",
  surface: "SYNTHETIC_GRASS",
  covered: false,
  pricePerSlot: "",
  slotMinutes: 60,
  active: true,
};

function single(value) {
  return Array.isArray(value) ? value[0] : value;
}

function Field({ label, ...props }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">{label}</Text>
      <TextInput
        className="h-13 rounded-xl border border-[#30363D] bg-[#17191C] px-4 text-white"
        placeholderTextColor="#69727B"
        {...props}
      />
    </View>
  );
}

function Choice({ selected, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-2 mr-2 rounded-xl border px-4 py-3 ${
        selected
          ? "border-[#80D160] bg-[#2C4930]"
          : "border-[#3B4249] bg-[#292D32]"
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          selected ? "text-[#80D160]" : "text-[#A9B1B8]"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function CourtFormScreen() {
  const params = useLocalSearchParams();
  const venueId = single(params.venueId);
  const courtId = single(params.courtId);
  const mode = single(params.mode);
  const venueName = single(params.venueName) ?? "Complejo";
  const isCreate = mode === "create";
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isCreate) return;
    courtsApi
      .managedList(venueId)
      .then((items) => {
        const court = items.find((item) => item.id === courtId);
        if (!court) throw new Error("No encontramos la cancha.");
        setForm({
          name: court.name,
          footballFormat: court.footballFormat,
          surface: court.surface,
          covered: court.covered,
          pricePerSlot: String(court.pricePerSlot),
          slotMinutes: Number(court.slotMinutes),
          active: court.active,
        });
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [courtId, isCreate, venueId]);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save() {
    const amount = Number(String(form.pricePerSlot).replace(",", "."));
    if (!form.name.trim() || !Number.isFinite(amount) || amount < 0) {
      Alert.alert("Revisá los datos", "Ingresá un nombre y un precio válido.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      footballFormat: form.footballFormat,
      surface: form.surface,
      covered: form.covered,
      pricePerSlot: amount,
      slotMinutes: form.slotMinutes,
      active: form.active,
    };

    try {
      setSaving(true);
      if (isCreate) await courtsApi.create(venueId, payload);
      else await courtsApi.update(courtId, payload);
      Alert.alert(
        isCreate ? "Cancha creada" : "Cancha actualizada",
        "Los cambios ya están disponibles en la gestión del complejo.",
        [{ text: "Aceptar", onPress: () => router.back() }],
      );
    } catch (requestError) {
      Alert.alert("No se pudo guardar", requestError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#17191C]">
        <ActivityIndicator color="#80D160" size="large" />
      </View>
    );
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
            {isCreate ? "Nueva cancha" : "Editar cancha"}
          </Text>
          <Text className="mt-0.5 text-sm text-[#8B949E]">{venueName}</Text>
        </View>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-10">
        {!!error && (
          <View className="mb-5 rounded-2xl border border-[#653B40] bg-[#2B2225] p-4">
            <Text className="text-[#F08A93]">{error}</Text>
          </View>
        )}

        <View className="mb-5 rounded-3xl border border-[#30363D] bg-[#202428] p-4">
          <Text className="mb-4 text-lg font-semibold text-white">
            Datos de la cancha
          </Text>
          <Field
            label="Nombre"
            value={form.name}
            onChangeText={(value) => update("name", value)}
            placeholder="Cancha 1"
          />
          <Field
            label="Precio por turno (UYU)"
            value={form.pricePerSlot}
            onChangeText={(value) => update("pricePerSlot", value)}
            keyboardType="decimal-pad"
            placeholder="1800"
          />

          <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">
            Formato
          </Text>
          <View className="mb-3 flex-row flex-wrap">
            {FORMATS.map(([value, label]) => (
              <Choice
                key={value}
                label={label}
                selected={form.footballFormat === value}
                onPress={() => update("footballFormat", value)}
              />
            ))}
          </View>

          <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">
            Superficie
          </Text>
          <View className="mb-3 flex-row flex-wrap">
            {SURFACES.map(([value, label]) => (
              <Choice
                key={value}
                label={label}
                selected={form.surface === value}
                onPress={() => update("surface", value)}
              />
            ))}
          </View>

          <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">
            Duración del turno
          </Text>
          <View className="mb-3 flex-row flex-wrap">
            {DURATIONS.map((value) => (
              <Choice
                key={value}
                label={`${value} min`}
                selected={form.slotMinutes === value}
                onPress={() => update("slotMinutes", value)}
              />
            ))}
          </View>

          <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">
            Tipo de espacio
          </Text>
          <View className="mb-3 flex-row flex-wrap">
            <Choice
              label="Al aire libre"
              selected={!form.covered}
              onPress={() => update("covered", false)}
            />
            <Choice
              label="Techada"
              selected={form.covered}
              onPress={() => update("covered", true)}
            />
          </View>

          <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">
            Estado
          </Text>
          <View className="flex-row flex-wrap">
            <Choice
              label="Activa"
              selected={form.active}
              onPress={() => update("active", true)}
            />
            <Choice
              label="Inactiva"
              selected={!form.active}
              onPress={() => update("active", false)}
            />
          </View>
        </View>

        <Pressable
          disabled={saving || !!error}
          onPress={save}
          className={`items-center rounded-xl bg-[#80D160] py-4 ${
            saving || error ? "opacity-50" : ""
          }`}
        >
          <Text className="font-semibold text-[#152012]">
            {saving ? "Guardando..." : "Guardar cancha"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
