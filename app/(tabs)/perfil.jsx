import { Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function Perfil() {
  const { user, signOut } = useAuth();

  return (
    <View className="flex-1 justify-center bg-slate-900 px-6">
      <View className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
        <Text className="text-2xl font-bold text-white">{user.firstName} {user.lastName}</Text>
        <Text className="mt-2 text-slate-300">{user.email}</Text>
        <Text className="mt-1 text-green-400">{user.role}</Text>

        <TouchableOpacity className="mt-8 items-center rounded-xl border border-red-400 py-3" onPress={signOut}>
          <Text className="font-semibold text-red-400">Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
