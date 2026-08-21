import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppAlert as Alert } from "../../../components/common/AppAlert";
import { adminUsersApi } from "../../../services/api";

export default function UserManagementScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async (search = "") => {
    setLoading(true);
    setError("");
    try {
      setUsers(await adminUsersApi.search(search, "OWNER"));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers]),
  );

  function changeStatus(user) {
    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const action = nextStatus === "ACTIVE" ? "activar" : "desactivar";
    Alert.alert(
      `${action === "activar" ? "Activar" : "Desactivar"} usuario`,
      `¿Querés ${action} a ${user.firstName} ${user.lastName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: action === "activar" ? "Activar" : "Desactivar",
          style: action === "desactivar" ? "destructive" : "default",
          onPress: async () => {
            try {
              const updated = await adminUsersApi.setStatus(
                user.id,
                nextStatus,
              );
              setUsers((current) =>
                current.map((item) =>
                  item.id === updated.id ? updated : item,
                ),
              );
            } catch (requestError) {
              Alert.alert("No se pudo actualizar", requestError.message);
            }
          },
        },
      ],
    );
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
          <Text className="text-2xl font-bold text-white">
            Administrar usuarios
          </Text>
          <Text className="mt-0.5 text-sm text-[#8B949E]">
            Dueños habilitados
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/userForm")}
          className="h-11 w-11 items-center justify-center rounded-xl bg-[#80D160]"
        >
          <Ionicons name="person-add-outline" size={22} color="#152012" />
        </Pressable>
      </View>

      <View className="mx-5 mb-5 flex-row items-center rounded-xl border border-[#30363D] bg-[#202428] px-4">
        <Ionicons name="search-outline" size={20} color="#8B949E" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => loadUsers(query)}
          placeholder="Email, nombre o cédula"
          placeholderTextColor="#69727B"
          className="h-13 flex-1 px-3 text-white"
        />
        <Pressable onPress={() => loadUsers(query)}>
          <Text className="font-semibold text-[#80D160]">Buscar</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#80D160" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-[#F08A93]">{error}</Text>
          <Pressable
            onPress={() => loadUsers(query)}
            className="mt-5 rounded-xl bg-[#80D160] px-5 py-3"
          >
            <Text className="font-semibold text-[#152012]">Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-5 pb-10"
        >
          <Text className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
            {users.length} {users.length === 1 ? "dueño" : "dueños"}
          </Text>
          {users.length === 0 ? (
            <View className="items-center rounded-3xl border border-dashed border-[#3B4249] bg-[#202428] px-6 py-12">
              <Ionicons name="people-outline" size={42} color="#69727B" />
              <Text className="mt-4 text-lg font-semibold text-white">
                No encontramos usuarios
              </Text>
              <Text className="mt-2 text-center text-sm text-[#8B949E]">
                Creá un dueño para poder asignarlo a un complejo.
              </Text>
            </View>
          ) : (
            users.map((user) => (
              <View
                key={user.id}
                className="mb-3 rounded-2xl border border-[#30363D] bg-[#202428] p-4"
              >
                <View className="flex-row items-start">
                  <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#2C4930]">
                    <Text className="font-bold text-[#80D160]">
                      {user.firstName?.charAt(0)}
                      {user.lastName?.charAt(0)}
                    </Text>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-white">
                      {user.firstName} {user.lastName}
                    </Text>
                    <Text className="mt-1 text-xs text-[#A9B1B8]">
                      {user.email}
                    </Text>
                    <Text className="mt-1 text-xs text-[#69727B]">
                      CI {user.nationalId}
                    </Text>
                  </View>
                  <View
                    className={`rounded-full px-2.5 py-1 ${
                      user.status === "ACTIVE" ? "bg-[#142019]" : "bg-[#292D32]"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-semibold uppercase ${
                        user.status === "ACTIVE"
                          ? "text-[#80D160]"
                          : "text-[#A9B1B8]"
                      }`}
                    >
                      {user.status === "ACTIVE" ? "Activo" : "Inactivo"}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => changeStatus(user)}
                  className="mt-4 items-center border-t border-[#30363D] pt-3"
                >
                  <Text
                    className={
                      user.status === "ACTIVE"
                        ? "font-semibold text-[#F08A93]"
                        : "font-semibold text-[#80D160]"
                    }
                  >
                    {user.status === "ACTIVE" ? "Desactivar" : "Activar"}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
