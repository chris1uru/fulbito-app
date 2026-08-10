import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
// 1. Importas el hook router de expo-router
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter(); // 2. Inicializas el router
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa un correo y contraseña.');
      return;
    }

    router.replace('/maps');
          

  };

  return (
    <View className="flex-1 justify-center px-6 bg-slate-900">
      <View className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
        <Text className="text-3xl font-bold text-white text-center mb-2">
          ¡Hola de nuevo!
        </Text>
        <Text className="text-slate-400 text-center mb-8">
          Ingresa a tu cuenta de Fulbito
        </Text>

        <View className="mb-4">
          <Text className="text-slate-300 font-medium mb-2">Correo electrónico</Text>
          <TextInput
            className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-green-500"
            placeholder="ejemplo@correo.com"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="mb-6">
          <Text className="text-slate-300 font-medium mb-2">Contraseña</Text>
          <TextInput
            className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-green-500"
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          className="w-full bg-green-500 py-4 rounded-xl items-center shadow-md active:bg-green-600"
          onPress={handleLogin}
        >
          <Text className="text-slate-950 font-bold text-base">
            Iniciar Sesión
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}