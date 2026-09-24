import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppAlert as Alert } from "../../../components/common/AppAlert";
import { adminUsersApi } from "../../../services/api";
import CountryPhoneField, {
  phoneValidationMessage,
} from "../../../components/common/CountryPhoneField";
import PasswordField from "../../../components/common/PasswordField";

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
  placeholder,
  error,
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        placeholder={placeholder}
        placeholderTextColor="#69727B"
        className={`h-13 rounded-xl border bg-[#17191C] px-4 text-white ${error ? "border-[#F08A93]" : "border-[#30363D]"}`}
      />
      {!!error && (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-2 text-xs text-[#F08A93]"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

export default function UserFormScreen() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "", form: "" }));
  }

  async function save() {
    const nationalId = form.nationalId.replace(/\D/g, "");
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = "Ingresá el nombre.";
    if (!form.lastName.trim()) nextErrors.lastName = "Ingresá el apellido.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      nextErrors.email = "Ingresá un email válido.";
    if (nationalId.length < 7 || nationalId.length > 8)
      nextErrors.nationalId = "Ingresá una cédula de 7 u 8 dígitos.";
    const phoneError = phoneValidationMessage(form.phone.trim());
    if (phoneError) nextErrors.phone = phoneError;
    if (form.password.length < 10)
      nextErrors.password = "Usá al menos 10 caracteres.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
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
      setErrors({ form: requestError.message });
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
          accessibilityRole="button"
          accessibilityLabel="Volver"
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
            error={errors.firstName}
          />
          <Field
            label="Apellido"
            value={form.lastName}
            onChangeText={(value) => update("lastName", value)}
            error={errors.lastName}
          />
          <Field
            label="Email"
            value={form.email}
            onChangeText={(value) => update("email", value)}
            keyboardType="email-address"
            placeholder="dueño@complejo.com"
            error={errors.email}
          />
          <Field
            label="Cédula"
            value={form.nationalId}
            onChangeText={(value) => update("nationalId", value)}
            keyboardType="number-pad"
            placeholder="12345678"
            error={errors.nationalId}
          />
          <CountryPhoneField
            value={form.phone}
            onChangeText={(phone) => update("phone", phone)}
            error={errors.phone}
          />
          <PasswordField
            label="Contraseña temporal"
            value={form.password}
            onChangeText={(value) => update("password", value)}
            placeholder="Mínimo 10 caracteres"
            error={errors.password}
          />
        </View>

        {!!errors.form && (
          <View
            accessibilityLiveRegion="assertive"
            className="mt-4 rounded-xl border border-[#653B40] bg-[#2B2225] p-4"
          >
            <Text className="text-sm text-[#F08A93]">{errors.form}</Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: saving }}
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
