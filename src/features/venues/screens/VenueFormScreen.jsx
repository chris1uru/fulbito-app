import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { useAuth } from "../../../providers/AuthProvider";
import { adminUsersApi, venuesApi } from "../../../services/api";

const EMPTY_FORM = {
  name: "",
  description: "",
  phone: "",
  whatsappPhone: "",
  cancellationNoticeHours: "4",
  departmentCode: "MAL",
  city: "Maldonado",
  neighborhood: "",
  street: "",
  streetNumber: "",
  reference: "",
  latitude: "-34.9011",
  longitude: "-54.9506",
  status: "DRAFT",
  ownerSearch: "",
};

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
  placeholder,
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">{label}</Text>
      <TextInput
        className={`rounded-xl border border-[#30363D] bg-[#17191C] px-4 text-white ${
          multiline ? "min-h-24 py-3" : "h-13"
        }`}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#69727B"
      />
    </View>
  );
}

function toForm(venue) {
  return {
    name: venue.name ?? "",
    description: venue.description ?? "",
    phone: venue.phone ?? "",
    whatsappPhone: venue.whatsappPhone ?? "",
    cancellationNoticeHours: String(venue.cancellationNoticeHours ?? 4),
    departmentCode: venue.location?.departmentCode ?? "MAL",
    city: venue.location?.city ?? "",
    neighborhood: venue.location?.neighborhood ?? "",
    street: venue.location?.street ?? "",
    streetNumber: venue.location?.streetNumber ?? "",
    reference: venue.location?.reference ?? "",
    latitude: String(venue.location?.latitude ?? ""),
    longitude: String(venue.location?.longitude ?? ""),
    status: venue.status ?? "DRAFT",
    ownerSearch: "",
  };
}

export default function VenueFormScreen() {
  const params = useLocalSearchParams();
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const venueId = Array.isArray(params.venueId)
    ? params.venueId[0]
    : params.venueId;
  const isCreate = mode === "create";
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user.role === "ADMIN";
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ownerResults, setOwnerResults] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [searchingOwners, setSearchingOwners] = useState(false);

  useEffect(() => {
    if (isCreate) return;
    const load = isAdmin
      ? venuesApi.adminOne(venueId)
      : venuesApi
          .mine()
          .then((items) => items.find((item) => item.id === venueId));

    load
      .then((venue) => {
        if (!venue)
          throw new Error("El complejo no está asignado a tu cuenta.");
        setForm(toForm(venue));
        setSelectedOwner(venue.owner ?? null);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [isAdmin, isCreate, venueId]);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function payload() {
    return {
      name: form.name.trim(),
      description: form.description.trim() || null,
      phone: form.phone.trim() || null,
      whatsappPhone: form.whatsappPhone.trim() || null,
      cancellationNoticeHours: Number(form.cancellationNoticeHours),
      status: form.status,
      location: {
        departmentCode: form.departmentCode.trim().toUpperCase(),
        city: form.city.trim(),
        neighborhood: form.neighborhood.trim() || null,
        street: form.street.trim(),
        streetNumber: form.streetNumber.trim() || null,
        reference: form.reference.trim() || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      },
    };
  }

  async function searchOwners() {
    try {
      setSearchingOwners(true);
      const results = await adminUsersApi.search(form.ownerSearch, "OWNER");
      setOwnerResults(results);
      if (results.length === 0)
        Alert.alert("Sin resultados", "No encontramos dueños con ese dato.");
    } catch (requestError) {
      Alert.alert("No se pudo buscar", requestError.message);
    } finally {
      setSearchingOwners(false);
    }
  }

  async function save() {
    if (!form.name.trim() || !form.city.trim() || !form.street.trim()) {
      Alert.alert("Faltan datos", "Completá nombre, ciudad y calle.");
      return;
    }
    if (
      !Number.isFinite(Number(form.latitude)) ||
      !Number.isFinite(Number(form.longitude))
    ) {
      Alert.alert("Ubicación inválida", "Revisá la latitud y la longitud.");
      return;
    }

    const cancellationNoticeHours = Number(form.cancellationNoticeHours);
    if (
      !Number.isInteger(cancellationNoticeHours) ||
      cancellationNoticeHours < 0 ||
      cancellationNoticeHours > 168
    ) {
      Alert.alert(
        "Plazo inválido",
        "La anticipación debe ser una cantidad de horas enteras entre 0 y 168.",
      );
      return;
    }

    if (isAdmin && !selectedOwner) {
      Alert.alert(
        "Falta el responsable",
        "Buscá y seleccioná un usuario con rol de dueño.",
      );
      return;
    }

    try {
      setSaving(true);
      let savedVenue;
      if (isAdmin) {
        const adminPayload = { ...payload(), ownerId: selectedOwner.id };
        if (isCreate) savedVenue = await venuesApi.adminCreate(adminPayload);
        else savedVenue = await venuesApi.adminUpdate(venueId, adminPayload);
      } else {
        savedVenue = await venuesApi.update(venueId, payload());
      }
      Alert.alert(
        isCreate ? "Complejo creado" : "Cambios guardados",
        isCreate
          ? "El complejo fue incorporado al catálogo."
          : "La información del complejo fue actualizada.",
        [
          {
            text: "Aceptar",
            onPress: () => {
              if (isCreate && savedVenue?.id) {
                router.replace({
                  pathname: "/manageVenue",
                  params: { venueId: savedVenue.id },
                });
                return;
              }
              router.back();
            },
          },
        ],
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
        <ActivityIndicator size="large" color="#80D160" />
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#17191C" }}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-lg font-semibold text-white">
            {error}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-5 rounded-xl bg-[#80D160] px-5 py-3"
          >
            <Text className="font-semibold text-[#152012]">Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
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
            {isCreate ? "Nuevo complejo" : "Editar complejo"}
          </Text>
          <Text className="mt-0.5 text-sm text-[#8B949E]">
            {isCreate ? "Alta administrativa" : "Información pública"}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-5 pb-10"
      >
        {isCreate && isAdmin && (
          <View className="mb-5 rounded-2xl border border-[#315C3B] bg-[#142019] p-4">
            <View className="flex-row items-center">
              <Ionicons
                name="shield-checkmark-outline"
                size={21}
                color="#80D160"
              />
              <Text className="ml-2 font-semibold text-white">
                Alta controlada
              </Text>
            </View>
            <Text className="mt-2 text-xs leading-5 text-[#B7D7AF]">
              Solo un administrador puede incorporar complejos al catálogo.
            </Text>
          </View>
        )}

        {isAdmin && (
          <View className="mb-5 rounded-3xl border border-[#30363D] bg-[#202428] p-4">
            <Text className="mb-1 text-lg font-semibold text-white">
              Responsable
            </Text>
            <Text className="mb-4 text-xs leading-5 text-[#8B949E]">
              Buscá un usuario existente por email o cédula. El usuario debe
              tener rol OWNER.
            </Text>
            <Field
              label="Email o cédula"
              value={form.ownerSearch}
              onChangeText={(value) => update("ownerSearch", value)}
              placeholder="dueño@complejo.com o 12345678"
            />
            <Pressable
              disabled={searchingOwners}
              onPress={searchOwners}
              className="items-center rounded-xl border border-[#3B4249] py-3"
            >
              <Text className="font-semibold text-[#C5CBD1]">
                {searchingOwners ? "Buscando..." : "Buscar usuario"}
              </Text>
            </Pressable>

            {!!selectedOwner && (
              <View className="mt-4 flex-row items-center rounded-xl border border-[#315C3B] bg-[#142019] p-3">
                <Ionicons name="checkmark-circle" size={22} color="#80D160" />
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-white">
                    {selectedOwner.firstName} {selectedOwner.lastName}
                  </Text>
                  <Text className="mt-0.5 text-xs text-[#B7D7AF]">
                    {selectedOwner.email}
                    {selectedOwner.nationalId
                      ? ` · CI ${selectedOwner.nationalId}`
                      : ""}
                  </Text>
                </View>
              </View>
            )}

            {ownerResults.map((owner) => (
              <Pressable
                key={owner.id}
                onPress={() => {
                  setSelectedOwner(owner);
                  setOwnerResults([]);
                }}
                className="mt-3 flex-row items-center rounded-xl border border-[#3B4249] bg-[#292D32] p-3"
              >
                <View className="h-9 w-9 items-center justify-center rounded-lg bg-[#2C4930]">
                  <Ionicons name="person-outline" size={18} color="#80D160" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-white">
                    {owner.firstName} {owner.lastName}
                  </Text>
                  <Text className="mt-0.5 text-xs text-[#8B949E]">
                    {owner.email} · CI {owner.nationalId}
                  </Text>
                </View>
                <Ionicons name="add-circle-outline" size={21} color="#80D160" />
              </Pressable>
            ))}
          </View>
        )}

        <View className="mb-5 rounded-3xl border border-[#30363D] bg-[#202428] p-4">
          <Text className="mb-4 text-lg font-semibold text-white">
            Datos básicos
          </Text>
          <Field
            label="Nombre"
            value={form.name}
            onChangeText={(value) => update("name", value)}
          />
          <Field
            label="Descripción"
            value={form.description}
            onChangeText={(value) => update("description", value)}
            multiline
          />
          <Field
            label="Teléfono"
            value={form.phone}
            onChangeText={(value) => update("phone", value)}
            keyboardType="phone-pad"
            placeholder="+598..."
          />
          <Field
            label="WhatsApp"
            value={form.whatsappPhone}
            onChangeText={(value) => update("whatsappPhone", value)}
            keyboardType="phone-pad"
            placeholder="+598..."
          />
        </View>

        <View className="mb-5 rounded-3xl border border-[#30363D] bg-[#202428] p-4">
          <View className="mb-3 flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#2C4930]">
              <Ionicons name="time-outline" size={21} color="#80D160" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-lg font-semibold text-white">
                Política de cancelación
              </Text>
              <Text className="mt-0.5 text-xs text-[#8B949E]">
                Se aplica a todo el complejo
              </Text>
            </View>
          </View>

          <Field
            label="Horas de anticipación"
            value={form.cancellationNoticeHours}
            onChangeText={(value) =>
              update("cancellationNoticeHours", value.replace(/[^0-9]/g, ""))
            }
            keyboardType="number-pad"
            placeholder="4"
          />

          <View className="rounded-xl border border-[#315C3B] bg-[#142019] p-3">
            <Text className="text-xs leading-5 text-[#B7D7AF]">
              Cada reserva conservará el plazo vigente cuando fue creada. Si el
              jugador cancela después, quedará registrada como tardía. En este
              MVP todavía no se aplican sanciones automáticas.
            </Text>
          </View>
        </View>

        <View className="mb-5 rounded-3xl border border-[#30363D] bg-[#202428] p-4">
          <Text className="mb-4 text-lg font-semibold text-white">
            Ubicación
          </Text>
          <Field
            label="Departamento"
            value={form.departmentCode}
            onChangeText={(value) => update("departmentCode", value)}
          />
          <Field
            label="Ciudad"
            value={form.city}
            onChangeText={(value) => update("city", value)}
          />
          <Field
            label="Barrio"
            value={form.neighborhood}
            onChangeText={(value) => update("neighborhood", value)}
          />
          <Field
            label="Calle"
            value={form.street}
            onChangeText={(value) => update("street", value)}
          />
          <Field
            label="Número"
            value={form.streetNumber}
            onChangeText={(value) => update("streetNumber", value)}
          />
          <Field
            label="Referencia"
            value={form.reference}
            onChangeText={(value) => update("reference", value)}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field
                label="Latitud"
                value={form.latitude}
                onChangeText={(value) => update("latitude", value)}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View className="flex-1">
              <Field
                label="Longitud"
                value={form.longitude}
                onChangeText={(value) => update("longitude", value)}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        </View>

        {isAdmin && (
          <View className="mb-5 rounded-3xl border border-[#30363D] bg-[#202428] p-4">
            <Text className="mb-1 text-lg font-semibold text-white">
              Estado
            </Text>
            <Text className="mb-4 text-xs text-[#8B949E]">
              Un borrador no aparece públicamente hasta ser activado.
            </Text>
            <View className="flex-row gap-2">
              {[
                ["DRAFT", "Borrador"],
                ["ACTIVE", "Activo"],
                ["INACTIVE", "Inactivo"],
              ].map(([value, label]) => (
                <Pressable
                  key={value}
                  onPress={() => update("status", value)}
                  className={`flex-1 items-center rounded-xl border py-3 ${
                    form.status === value
                      ? "border-[#80D160] bg-[#2C4930]"
                      : "border-[#3B4249] bg-[#292D32]"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      form.status === value
                        ? "text-[#80D160]"
                        : "text-[#A9B1B8]"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <Pressable
          disabled={saving}
          onPress={save}
          className={`items-center rounded-xl bg-[#80D160] py-4 ${saving ? "opacity-60" : ""}`}
        >
          <Text className="font-semibold text-[#152012]">
            {saving
              ? "Guardando..."
              : isCreate
                ? "Crear complejo"
                : "Guardar cambios"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
