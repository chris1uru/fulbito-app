import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppAlert as Alert } from "../../../components/common/AppAlert";
import { useAuth } from "../../../providers/AuthProvider";

function Field({ label, value, onChangeText, editable = true, ...props }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">{label}</Text>
      <TextInput
        className={`h-13 rounded-xl border px-4 ${
          editable
            ? "border-[#30363D] bg-[#17191C] text-white"
            : "border-[#292D32] bg-[#25292D] text-[#69727B]"
        }`}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholderTextColor="#69727B"
        {...props}
      />
    </View>
  );
}

export default function ProfileEditScreen() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phone: user.phone ?? "",
  });
  const [saving, setSaving] = useState(false);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert("Faltan datos", "Completá tu nombre y apellido.");
      return;
    }
    if (form.phone.trim() && !/^\+[1-9][0-9]{7,14}$/.test(form.phone.trim())) {
      Alert.alert(
        "Teléfono inválido",
        "Ingresalo con código de país, por ejemplo +59899123456.",
      );
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || null,
      });
      Alert.alert(
        "Perfil actualizado",
        "Tus datos personales fueron guardados.",
        [{ text: "Aceptar", onPress: () => router.back() }],
      );
    } catch (requestError) {
      Alert.alert("No se pudo guardar", requestError.message);
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
          <Text className="text-2xl font-bold text-white">Editar perfil</Text>
          <Text className="mt-0.5 text-sm text-[#8B949E]">
            Actualizá tus datos personales
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerClassName="px-5 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-5 rounded-3xl border border-[#30363D] bg-[#202428] p-4">
          <Text className="mb-4 text-lg font-semibold text-white">
            Información editable
          </Text>
          <Field
            label="Nombre"
            value={form.firstName}
            onChangeText={(value) => update("firstName", value)}
            autoCapitalize="words"
          />
          <Field
            label="Apellido"
            value={form.lastName}
            onChangeText={(value) => update("lastName", value)}
            autoCapitalize="words"
          />
          <Field
            label="Teléfono"
            value={form.phone}
            onChangeText={(value) => update("phone", value)}
            keyboardType="phone-pad"
            placeholder="+59899123456"
          />
        </View>

        <View className="mb-5 rounded-3xl border border-[#30363D] bg-[#202428] p-4">
          <View className="mb-4 flex-row items-start">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#2C4930]">
              <Ionicons name="lock-closed-outline" size={19} color="#80D160" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-white">Datos protegidos</Text>
              <Text className="mt-1 text-xs leading-5 text-[#8B949E]">
                Estos cambios tendrán verificación de identidad y se habilitarán
                en una próxima etapa.
              </Text>
            </View>
          </View>
          <Field
            label="Correo electrónico"
            value={user.email}
            editable={false}
          />
          {!!user.nationalId && (
            <Field label="Cédula" value={user.nationalId} editable={false} />
          )}
          <Field
            label="Contraseña"
            value="••••••••••••"
            editable={false}
            secureTextEntry
          />
          <View className="-mt-1 self-start rounded-lg bg-[#2C4930] px-3 py-1.5">
            <Text className="text-xs font-semibold text-[#80D160]">
              Cambio de contraseña: próximamente
            </Text>
          </View>
        </View>

        <View className="mb-5 rounded-2xl border border-[#3B4249] bg-[#202428] p-4">
          <View className="flex-row items-start">
            <Ionicons
              name="information-circle-outline"
              size={21}
              color="#A9B1B8"
            />
            <Text className="ml-2 flex-1 text-xs leading-5 text-[#A9B1B8]">
              Editar tu perfil no cambia tu rol, tu estado ni te permite actuar
              en nombre de otra cuenta.
            </Text>
          </View>
        </View>

        <Pressable
          disabled={saving}
          onPress={save}
          className={`items-center rounded-xl bg-[#80D160] py-4 ${saving ? "opacity-60" : ""}`}
        >
          <Text className="font-semibold text-[#152012]">
            {saving ? "Guardando..." : "Guardar cambios"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
