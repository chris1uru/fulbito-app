import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { courtsApi } from "../../../services/api";

const FORMATS = {
  FIVE: "Fútbol 5",
  SEVEN: "Fútbol 7",
  ELEVEN: "Fútbol 11",
};

const SURFACES = {
  SYNTHETIC_GRASS: "Césped sintético",
  NATURAL_GRASS: "Césped natural",
  INDOOR: "Interior",
  CONCRETE: "Hormigón",
  OTHER: "Otra superficie",
};

function single(value) {
  return Array.isArray(value) ? value[0] : value;
}

function price(value) {
  return `$ ${Number(value).toLocaleString("es-UY")}`;
}

export default function CourtManagementScreen() {
  const params = useLocalSearchParams();
  const venueId = single(params.venueId);
  const venueName = single(params.venueName) ?? "Complejo";
  const router = useRouter();
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        setCourts(await courtsApi.managedList(venueId));
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [venueId],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function openForm(court) {
    router.push({
      pathname: "/courtForm",
      params: {
        venueId,
        venueName,
        mode: court ? "edit" : "create",
        ...(court ? { courtId: court.id } : {}),
      },
    });
  }

  function openPhotos(court) {
    router.push({
      pathname: "/imageManagement",
      params: {
        target: "court",
        targetId: court.id,
        targetName: court.name,
      },
    });
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
          <Text className="text-2xl font-bold text-white">Canchas</Text>
          <Text className="mt-0.5 text-sm text-[#8B949E]">{venueName}</Text>
        </View>
        <Pressable
          onPress={() => openForm(null)}
          className="h-11 w-11 items-center justify-center rounded-xl bg-[#80D160]"
        >
          <Ionicons name="add" size={26} color="#152012" />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#80D160" size="large" />
          <Text className="mt-3 text-[#A9B1B8]">Cargando canchas...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={40} color="#F08A93" />
          <Text className="mt-4 text-center text-white">{error}</Text>
          <Pressable
            onPress={() => load()}
            className="mt-5 rounded-xl bg-[#80D160] px-5 py-3"
          >
            <Text className="font-semibold text-[#152012]">Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-5 pb-10"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#80D160"
            />
          }
        >
          <View className="mb-5 rounded-2xl border border-[#315C3B] bg-[#142019] p-4">
            <Text className="text-sm leading-5 text-[#B7D7AF]">
              Las canchas inactivas se conservan, pero no aparecen para los
              jugadores ni generan turnos públicos.
            </Text>
          </View>

          {courts.length === 0 ? (
            <View className="items-center rounded-3xl border border-dashed border-[#3B4249] bg-[#202428] px-6 py-12">
              <Ionicons name="football-outline" size={44} color="#69727B" />
              <Text className="mt-4 text-lg font-semibold text-white">
                Todavía no hay canchas
              </Text>
              <Text className="mt-2 text-center text-sm text-[#8B949E]">
                Creá la primera y luego configurá los horarios del complejo.
              </Text>
            </View>
          ) : (
            courts.map((court) => (
              <View
                key={court.id}
                className="mb-4 rounded-3xl border border-[#30363D] bg-[#202428] p-5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="mr-3 flex-1">
                    <Text className="text-xl font-bold text-white">
                      {court.name}
                    </Text>
                    <Text className="mt-1 text-sm text-[#A9B1B8]">
                      {FORMATS[court.footballFormat]} ·{" "}
                      {SURFACES[court.surface]}
                    </Text>
                  </View>
                  <View
                    className={`rounded-full px-3 py-1.5 ${
                      court.active ? "bg-[#142019]" : "bg-[#292D32]"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        court.active ? "text-[#80D160]" : "text-[#A9B1B8]"
                      }`}
                    >
                      {court.active ? "Activa" : "Inactiva"}
                    </Text>
                  </View>
                </View>

                <View className="mt-4 flex-row gap-2">
                  <View className="rounded-lg bg-[#292D32] px-3 py-2">
                    <Text className="text-xs text-[#C5CBD1]">
                      {court.slotMinutes} min
                    </Text>
                  </View>
                  <View className="rounded-lg bg-[#292D32] px-3 py-2">
                    <Text className="text-xs text-[#C5CBD1]">
                      {court.covered ? "Techada" : "Exterior"}
                    </Text>
                  </View>
                  <View className="rounded-lg bg-[#2C4930] px-3 py-2">
                    <Text className="text-xs font-semibold text-[#80D160]">
                      {price(court.pricePerSlot)}
                    </Text>
                  </View>
                </View>

                <View className="mt-4 flex-row gap-2 border-t border-[#30363D] pt-4">
                  <Pressable
                    onPress={() => openForm(court)}
                    className="flex-1 flex-row items-center justify-center rounded-xl border border-[#3B4249] py-3"
                  >
                    <Ionicons name="create-outline" size={18} color="#C5CBD1" />
                    <Text className="ml-2 font-semibold text-[#C5CBD1]">
                      Editar
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openPhotos(court)}
                    className="flex-1 flex-row items-center justify-center rounded-xl bg-[#80D160] py-3"
                  >
                    <Ionicons name="images-outline" size={18} color="#152012" />
                    <Text className="ml-2 font-semibold text-[#152012]">
                      Fotos
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
