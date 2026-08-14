import { Link } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";

const fields = [
  ["Nombre", "firstName"],
  ["Apellido", "lastName"],
  ["Correo electrónico", "email"],
  ["Teléfono (+598...)", "phone"],
  ["Contraseña", "password"],
];

export default function Register() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function register() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || form.password.length < 8) {
      Alert.alert("Revisa los datos", "Completa nombre, apellido, correo y una contraseña de al menos 8 caracteres.");
      return;
    }

    try {
      setLoading(true);
      await signUp({ ...form, email: form.email.trim().toLowerCase(), phone: form.phone.trim() || null });
    } catch (error) {
      Alert.alert("No se pudo crear la cuenta", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-slate-900" contentContainerClassName="flex-grow justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
      <View className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
        <Text className="mb-2 text-center text-3xl font-bold text-white">Crea tu cuenta</Text>
        <Text className="mb-7 text-center text-slate-400">Registrate para reservar canchas</Text>

        {fields.map(([label, name]) => (
          <View className="mb-4" key={name}>
            <Text className="mb-2 font-medium text-slate-300">{label}</Text>
            <TextInput
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
              placeholderTextColor="#64748b"
              value={form[name]}
              onChangeText={(value) => setForm({ ...form, [name]: value })}
              autoCapitalize={name === "email" ? "none" : "sentences"}
              keyboardType={name === "email" ? "email-address" : name === "phone" ? "phone-pad" : "default"}
              secureTextEntry={name === "password"}
            />
          </View>
        ))}

        <TouchableOpacity className={`items-center rounded-xl bg-green-500 py-4 ${loading ? "opacity-60" : ""}`} disabled={loading} onPress={register}>
          <Text className="font-bold text-slate-950">{loading ? "Creando cuenta..." : "Crear cuenta"}</Text>
        </TouchableOpacity>

        <Link href="/loginScreen" asChild>
          <TouchableOpacity className="mt-5 items-center">
            <Text className="text-slate-300">Ya tengo una cuenta</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}
