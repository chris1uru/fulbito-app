import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { AppAlert as Alert } from "../../../components/common/AppAlert";
import { useAuth } from "../../../providers/AuthProvider";

export default function ProfileScreen() {
  const { user, refreshUser, signOut } = useAuth();
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();
  const canManageVenues = user.role === "ADMIN";
  const roleLabel = {
    ADMIN: "Administrador",
    OWNER: "Dueño de complejo",
    PLAYER: "Jugador",
  }[user.role];

  useFocusEffect(
    useCallback(() => {
      refreshUser().catch(() => {});
    }, [refreshUser]),
  );

  function confirmSignOut() {
    Alert.alert(
      "Cerrar sesión",
      "¿Seguro que querés cerrar tu sesión de Fulbito?",
      [
        { text: "Volver", style: "cancel" },
        { text: "Cerrar sesión", style: "destructive", onPress: signOut },
      ],
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#17191C" }}
      edges={["top"]}
    >
      <ScrollView
        contentContainerClassName="px-4 pt-5"
        contentContainerStyle={{
          paddingTop: 16,
          paddingHorizontal: 12,
          paddingBottom: bottom + 88,
        }}
      >
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-semibold text-white">Mi perfil</Text>
            <Text className="mt-1 text-sm text-[#A9B1B8]">
              Tu cuenta de Fulbito
            </Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#2C4930]">
            <Ionicons name="football-outline" size={22} color="#80D160" />
          </View>
        </View>

        <View className="mb-4 overflow-hidden rounded-3xl border border-[#30363D] bg-[#202428]">
          <View className="h-20 bg-[#2C4930]" />
          <View className="px-5 pb-5">
            <View className="-mt-10 h-20 w-20 items-center justify-center rounded-3xl border-4 border-[#202428] bg-[#35583A]">
              <Text className="text-3xl font-semibold text-[#80D160]">
                {user.firstName?.charAt(0)}
                {user.lastName?.charAt(0)}
              </Text>
            </View>

            <View className="mt-3 flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-2xl font-semibold text-white">
                  {user.firstName} {user.lastName}
                </Text>
                <Text className="mt-1 text-sm text-[#A9B1B8]">
                  {user.email}
                </Text>
              </View>
              <View className="rounded-lg bg-[#2C4930] px-3 py-1.5">
                <Text className="text-xs font-semibold text-[#80D160]">
                  {roleLabel ?? user.role}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text className="mb-3 mt-2 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
          Información personal
        </Text>
        <View className="overflow-hidden rounded-2xl border border-[#30363D] bg-[#202428]">
          <View className="flex-row items-center px-4 py-4">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#292D32]">
              <Ionicons name="person-outline" size={19} color="#80D160" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-[#8B949E]">Nombre completo</Text>
              <Text className="mt-0.5 font-medium text-white">
                {user.firstName} {user.lastName}
              </Text>
            </View>
          </View>

          <View className="mx-4 h-px bg-[#30363D]" />

          <View className="flex-row items-center px-4 py-4">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#292D32]">
              <Ionicons name="mail-outline" size={19} color="#80D160" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-[#8B949E]">Correo electrónico</Text>
              <Text className="mt-0.5 font-medium text-white">
                {user.email}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          className="mt-4 flex-row items-center justify-center rounded-xl bg-[#80D160] py-4"
          onPress={() => router.push("/profileEdit")}
        >
          <Ionicons name="create-outline" size={20} color="#152012" />
          <Text className="ml-2 font-semibold text-[#152012]">
            Editar mis datos
          </Text>
        </TouchableOpacity>

        {canManageVenues && (
          <>
            <Text className="mb-3 mt-6 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
              Gestión
            </Text>
            <View className="overflow-hidden rounded-2xl border border-[#30363D] bg-[#202428]">
              <TouchableOpacity
                className="flex-row items-center px-4 py-4"
                onPress={() => router.push("/venueManagement")}
              >
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-[#2C4930]">
                  <Ionicons name="business-outline" size={21} color="#80D160" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-white">
                    {user.role === "ADMIN"
                      ? "Administrar complejos"
                      : "Mis complejos"}
                  </Text>
                  <Text className="mt-1 text-xs leading-4 text-[#8B949E]">
                    {user.role === "ADMIN"
                      ? "Alta, edición, asignación y desactivación"
                      : "Editá la información de los complejos a tu cargo"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#69727B" />
              </TouchableOpacity>

              {user.role === "ADMIN" && (
                <>
                  <View className="mx-4 h-px bg-[#30363D]" />
                  <TouchableOpacity
                    onPress={() => router.push("/userManagement")}
                    className="flex-row items-center px-4 py-4"
                  >
                    <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-[#292D32]">
                      <Ionicons
                        name="people-outline"
                        size={21}
                        color="#A9B1B8"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-white">
                        Administrar usuarios
                      </Text>
                      <Text className="mt-1 text-xs leading-4 text-[#8B949E]">
                        Crear usuarios y asignar responsables
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#69727B"
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}

        <TouchableOpacity
          className="mt-6 flex-row items-center justify-center rounded-xl border border-[#653B40] bg-[#2B2225] py-4"
          onPress={confirmSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#F08A93" />
          <Text className="ml-2 font-semibold text-[#F08A93]">
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
