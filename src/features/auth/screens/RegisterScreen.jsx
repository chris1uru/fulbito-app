import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppAlert as Alert } from "../../../components/common/AppAlert";
import CountryPhoneField, {
  phoneValidationMessage,
} from "../../../components/common/CountryPhoneField";
import { useAuth } from "../../../providers/AuthProvider";

const fields = [
  ["Nombre", "firstName", "person-outline"],
  ["Apellido", "lastName", "person-outline"],
  ["Correo electrónico", "email", "mail-outline"],
];

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  async function register() {
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      form.password.length < 10
    ) {
      Alert.alert(
        "Revisa los datos",
        "Completa nombre, apellido, correo y una contraseña de al menos 10 caracteres.",
      );
      return;
    }
    const phoneError = phoneValidationMessage(form.phone);
    if (phoneError) {
      Alert.alert("Teléfono inválido", phoneError);
      return;
    }

    try {
      setLoading(true);
      await signUp({
        ...form,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
      });
    } catch (error) {
      Alert.alert("No se pudo crear la cuenta", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#17191C" }}>
      <ScrollView
        contentContainerClassName="flex-grow px-5 py-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-7 flex-row items-center">
          <View className="flex-1">
            <Text className="text-3xl font-semibold text-white">
              Creá tu cuenta
            </Text>
            <Text className="mt-1 text-sm text-[#A9B1B8]">
              Sumate y reservá tu próxima cancha
            </Text>
          </View>
        </View>

        <View className="rounded-3xl border border-[#30363D] bg-[#202428] p-5">
          <View className="mb-6 flex-row items-center rounded-2xl bg-[#2C4930] p-4">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-[#35583A]">
              <Ionicons name="football-outline" size={23} color="#80D160" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-white">
                Tu equipo empieza acá
              </Text>
              <Text className="mt-0.5 text-xs text-[#B7D7AF]">
                Completá tus datos para comenzar
              </Text>
            </View>
          </View>

          {fields.map(([label, name, icon]) => (
            <View className="mb-4" key={name}>
              <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">
                {label}
              </Text>
              <View className="h-13 flex-row items-center rounded-xl border border-[#30363D] bg-[#17191C] px-4">
                <Ionicons name={icon} size={19} color="#8B949E" />
                <TextInput
                  className="h-full flex-1 px-3 text-white"
                  placeholderTextColor="#69727B"
                  value={form[name]}
                  onChangeText={(value) => setForm({ ...form, [name]: value })}
                  autoCapitalize={name === "email" ? "none" : "sentences"}
                  keyboardType={
                    name === "email"
                      ? "email-address"
                      : name === "phone"
                        ? "phone-pad"
                        : "default"
                  }
                />
              </View>
            </View>
          ))}

          <CountryPhoneField
            value={form.phone}
            onChangeText={(phone) =>
              setForm((current) => ({ ...current, phone }))
            }
          />

          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">
              Contraseña
            </Text>
            <View className="h-13 flex-row items-center rounded-xl border border-[#30363D] bg-[#17191C] px-4">
              <Ionicons name="lock-closed-outline" size={19} color="#8B949E" />
              <TextInput
                className="h-full flex-1 px-3 text-white"
                placeholder="Contraseña"
                placeholderTextColor="#69727B"
                value={form.password}
                onChangeText={(password) =>
                  setForm((current) => ({ ...current, password }))
                }
                autoCapitalize="none"
                secureTextEntry={!isPasswordVisible}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible((current) => !current)}
                accessibilityRole="button"
                accessibilityLabel={
                  isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#A9B1B8"
                />
              </TouchableOpacity>
            </View>
            <Text className="mt-2 text-xs text-[#8B949E]">
              Mínimo 10 caracteres
            </Text>
          </View>

          <TouchableOpacity
            className={`mt-2 flex-row items-center justify-center rounded-xl bg-[#80D160] py-4 ${loading ? "opacity-60" : ""}`}
            disabled={loading}
            onPress={register}
          >
            <Text className="mr-2 font-semibold text-[#152012]">
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Text>
            {!loading && (
              <Ionicons name="arrow-forward" size={18} color="#152012" />
            )}
          </TouchableOpacity>
        </View>

        <Link href="/loginScreen" asChild>
          <TouchableOpacity className="mt-6 items-center py-2">
            <Text className="text-[#A9B1B8]">
              ¿Ya tenés cuenta?{" "}
              <Text className="font-semibold text-[#80D160]">
                Iniciá sesión
              </Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}
