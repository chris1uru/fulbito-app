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
import { useAuth } from "../../../providers/AuthProvider";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Faltan datos", "Ingresa tu correo y contraseña.");
      return;
    }

    try {
      setLoading(true);
      await signIn({ email: email.trim().toLowerCase(), password });
    } catch (error) {
      Alert.alert("No se pudo iniciar sesión", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#17191C" }}>
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-5 py-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-9 items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-[#2C4930]">
            <Ionicons name="football-outline" size={34} color="#80D160" />
          </View>
          <Text className="text-4xl font-semibold text-white">
            Ful<Text className="text-[#80D160]">bito</Text>
          </Text>
          <Text className="mt-2 text-sm text-[#A9B1B8]">
            Tu próxima cancha está más cerca
          </Text>
        </View>

        <View className="rounded-3xl border border-[#30363D] bg-[#202428] p-5">
          <Text className="text-2xl font-semibold text-white">
            ¡Hola de nuevo!
          </Text>
          <Text className="mb-7 mt-1 text-sm text-[#A9B1B8]">
            Ingresá a tu cuenta para seguir jugando
          </Text>

          <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">
            Correo electrónico
          </Text>
          <View className="mb-4 h-13 flex-row items-center rounded-xl border border-[#30363D] bg-[#17191C] px-4">
            <Ionicons name="mail-outline" size={19} color="#8B949E" />
            <TextInput
              className="h-full flex-1 px-3 text-white"
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#69727B"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text className="mb-2 text-sm font-medium text-[#C5CBD1]">
            Contraseña
          </Text>
          <View className="mb-6 h-13 flex-row items-center rounded-xl border border-[#30363D] bg-[#17191C] px-4">
            <Ionicons name="lock-closed-outline" size={19} color="#8B949E" />
            <TextInput
              className="h-full flex-1 px-3 text-white"
              placeholder="••••••••"
              placeholderTextColor="#69727B"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            className={`flex-row items-center justify-center rounded-xl bg-[#80D160] py-4 ${loading ? "opacity-60" : ""}`}
            disabled={loading}
            onPress={handleLogin}
          >
            <Text className="mr-2 font-semibold text-[#152012]">
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </Text>
            {!loading && (
              <Ionicons name="arrow-forward" size={18} color="#152012" />
            )}
          </TouchableOpacity>

          <View className="my-6 flex-row items-center">
            <View className="h-px flex-1 bg-[#30363D]" />
            <Text className="px-3 text-xs text-[#8B949E]">O continuá con</Text>
            <View className="h-px flex-1 bg-[#30363D]" />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 flex-row items-center justify-center rounded-xl border border-[#3B4249] bg-[#292D32] py-3.5">
              <Ionicons name="logo-google" size={19} color="#FFFFFF" />
              <Text className="ml-2 font-medium text-white">Google</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 flex-row items-center justify-center rounded-xl border border-[#3B4249] bg-[#292D32] py-3.5">
              <Ionicons name="logo-apple" size={21} color="#FFFFFF" />
              <Text className="ml-2 font-medium text-white">Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Link href="/register" asChild>
          <TouchableOpacity className="mt-6 items-center py-2">
            <Text className="text-[#A9B1B8]">
              ¿No tenés cuenta?{" "}
              <Text className="font-semibold text-[#80D160]">Registrate</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}
