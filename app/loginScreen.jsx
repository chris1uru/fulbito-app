import { Link } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";

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
    <View className="flex-1 justify-center bg-slate-900 px-6">
      <View className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
        <Text className="mb-2 text-center text-3xl font-bold text-white">¡Hola de nuevo!</Text>
        <Text className="mb-8 text-center text-slate-400">Ingresa a tu cuenta de Fulbito</Text>

        <Text className="mb-2 font-medium text-slate-300">Correo electrónico</Text>
        <TextInput
          className="mb-4 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
          placeholder="ejemplo@correo.com"
          placeholderTextColor="#64748b"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <Text className="mb-2 font-medium text-slate-300">Contraseña</Text>
        <TextInput
          className="mb-6 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
          placeholder="••••••••"
          placeholderTextColor="#64748b"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          className={`items-center rounded-xl bg-green-500 py-4 ${loading ? "opacity-60" : ""}`}
          disabled={loading}
          onPress={handleLogin}
        >
          <Text className="font-bold text-slate-950">{loading ? "Ingresando..." : "Iniciar sesión"}</Text>
        </TouchableOpacity>

        <Link href="/register" asChild>
          <TouchableOpacity className="mt-5 items-center">
            <Text className="text-slate-300">
              ¿No tenés cuenta? <Text className="font-bold text-green-400">Registrate</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
