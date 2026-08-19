import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { adminUsersApi } from "../../../services/api";

const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  nationalId: "",
  phone: "",
  password: "",
};

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  secureTextEntry,
  placeholder,
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        placeholder={placeholder}
        placeholderTextColor="#69727B"
        className="h-13 rounded-xl border border-[#30363D] bg-[#17191C] px-4 text-white"
      />
    </View>
  );
}

export default function UserFormScreen() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save() {
    const nationalId = form.nationalId.replace(/\D/g, "");
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      Alert.alert("Faltan datos", "Completá nombre, apellido y email.");
      return;
    }
    if (nationalId.length < 7 || nationalId.length > 8) {
      Alert.alert("Cédula inválida", "Ingresá una cédula de 7 u 8 dígitos.");
      return;
    }
    if (form.password.length < 8) {
      Alert.alert("Contraseña inválida", "Debe tener al menos 8 caracteres.");
      return;
    }

    try {
      setSaving(true);
      await adminUsersApi.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        nationalId,
        phone: form.phone.trim() || null,
        password: form.password,
        role: "OWNER",
      });
      Alert.alert(
        "Usuario creado",
        "El dueño ya puede ser asignado a un complejo.",
        [{ text: "Aceptar", onPress: () => router.back() }],
      );
    } catch (requestError) {
      Alert.alert("No se pudo crear", requestError.message);
    } finally {
      setSaving(false);
    }
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
          <Text className="text-2xl font-bold text-white">Nuevo dueño</Text>
          <Text className="mt-0.5 text-sm text-[#8B949E]">
            Alta administrativa
          </Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-10"
      >
        <View className="mb-5 rounded-2xl border border-[#315C3B] bg-[#142019] p-4">
          <View className="flex-row items-center">
            <Ionicons
              name="shield-checkmark-outline"
              size={21}
              color="#80D160"
            />
            <Text className="ml-2 font-semibold text-white">
              Usuario controlado
            </Text>
          </View>
          <Text className="mt-2 text-xs leading-5 text-[#B7D7AF]">
            El usuario se crea con rol de dueño. Los administradores no pueden
            crearse desde la app.
          </Text>
        </View>

        <View className="rounded-3xl border border-[#30363D] bg-[#202428] p-4">
          <Field
            label="Nombre"
            value={form.firstName}
            onChangeText={(value) => update("firstName", value)}
          />
          <Field
            label="Apellido"
            value={form.lastName}
            onChangeText={(value) => update("lastName", value)}
          />
          <Field
            label="Email"
            value={form.email}
            onChangeText={(value) => update("email", value)}
            keyboardType="email-address"
            placeholder="dueño@complejo.com"
          />
          <Field
            label="Cédula"
            value={form.nationalId}
            onChangeText={(value) => update("nationalId", value)}
            keyboardType="number-pad"
            placeholder="12345678"
          />
          <Field
            label="Teléfono"
            value={form.phone}
            onChangeText={(value) => update("phone", value)}
            keyboardType="phone-pad"
            placeholder="+598..."
          />
          <Field
            label="Contraseña temporal"
            value={form.password}
            onChangeText={(value) => update("password", value)}
            secureTextEntry
            placeholder="Mínimo 8 caracteres"
          />
        </View>

        <Pressable
          disabled={saving}
          onPress={save}
          className={`mt-5 items-center rounded-xl bg-[#80D160] py-4 ${saving ? "opacity-60" : ""}`}
        >
          <Text className="font-semibold text-[#152012]">
            {saving ? "Creando usuario..." : "Crear dueño"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
