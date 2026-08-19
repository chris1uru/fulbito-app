import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../providers/AuthProvider";
import { venuesApi } from "../../../services/api";

const STATUS = {
  ACTIVE: { label: "Activo", text: "#80D160", background: "#142019" },
  DRAFT: { label: "Borrador", text: "#F4C95D", background: "#2A2517" },
  INACTIVE: { label: "Inactivo", text: "#A9B1B8", background: "#292D32" },
};

function addressOf(location) {
  if (!location) return "Ubicación pendiente";
  return [location.street, location.streetNumber, location.city]
    .filter(Boolean)
    .join(" · ");
}

function VenueCard({ venue, isAdmin, onPress }) {
  const status = STATUS[venue.status] ?? STATUS.INACTIVE;

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-3xl border border-[#30363D] bg-[#202428]"
    >
      {venue.coverImageUrl ? (
        <Image
          source={{ uri: venue.coverImageUrl }}
          className="h-36 w-full"
          resizeMode="cover"
        />
      ) : (
        <View className="h-28 items-center justify-center bg-[#18231F]">
          <Ionicons name="image-outline" size={32} color="#69727B" />
          <Text className="mt-2 text-xs text-[#8B949E]">Sin portada</Text>
        </View>
      )}

      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="mr-3 flex-1">
            <Text className="text-lg font-bold text-white">{venue.name}</Text>
            <View className="mt-2 flex-row items-start">
              <Ionicons name="location-outline" size={16} color="#80D160" />
              <Text className="ml-1.5 flex-1 text-sm text-[#A9B1B8]">
                {addressOf(venue.location)}
              </Text>
            </View>
          </View>
          <View
            className="rounded-full px-3 py-1.5"
            style={{ backgroundColor: status.background }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: status.text }}
            >
              {status.label}
            </Text>
          </View>
        </View>

        {isAdmin && (
          <Text className="mt-3 text-xs text-[#69727B]">
            Responsable:{" "}
            {venue.owner
              ? `${venue.owner.firstName} ${venue.owner.lastName}`
              : "sin asignar"}
          </Text>
        )}

        <View className="mt-4 flex-row items-center justify-between border-t border-[#30363D] pt-4">
          <Text className="font-semibold text-[#80D160]">
            Gestionar complejo
          </Text>
          <Ionicons name="arrow-forward" size={19} color="#80D160" />
        </View>
      </View>
    </Pressable>
  );
}

export default function VenueManagementScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user.role === "ADMIN";
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadVenues = useCallback(
    async (refresh = false) => {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");
      try {
        const data = isAdmin
          ? await venuesApi.adminList()
          : await venuesApi.mine();
        setVenues(data);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAdmin],
  );

  useFocusEffect(
    useCallback(() => {
      loadVenues();
    }, [loadVenues]),
  );

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
            {isAdmin ? "Administrar complejos" : "Mis complejos"}
          </Text>
          <Text className="mt-0.5 text-sm text-[#8B949E]">
            {isAdmin
              ? "Catálogo oficial de Fulbito"
              : "Complejos asignados a tu cuenta"}
          </Text>
        </View>
        {isAdmin && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/venueForm",
                params: { mode: "create" },
              })
            }
            className="h-11 w-11 items-center justify-center rounded-xl bg-[#80D160]"
          >
            <Ionicons name="add" size={26} color="#152012" />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#80D160" />
          <Text className="mt-3 text-[#A9B1B8]">Cargando complejos...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cloud-offline-outline" size={40} color="#F08A93" />
          <Text className="mt-4 text-center text-lg font-semibold text-white">
            No pudimos cargar los complejos
          </Text>
          <Text className="mt-2 text-center text-sm text-[#A9B1B8]">
            {error}
          </Text>
          <Pressable
            onPress={() => loadVenues()}
            className="mt-5 rounded-xl bg-[#80D160] px-5 py-3"
          >
            <Text className="font-semibold text-[#152012]">Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-5 pb-10"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadVenues(true)}
              tintColor="#80D160"
            />
          }
        >
          <Text className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
            {venues.length} {venues.length === 1 ? "complejo" : "complejos"}
          </Text>

          {venues.length === 0 ? (
            <View className="items-center rounded-3xl border border-dashed border-[#3B4249] bg-[#202428] px-6 py-12">
              <Ionicons name="business-outline" size={42} color="#69727B" />
              <Text className="mt-4 text-lg font-semibold text-white">
                {isAdmin
                  ? "Todavía no hay complejos"
                  : "No tenés complejos asignados"}
              </Text>
              <Text className="mt-2 text-center text-sm leading-5 text-[#8B949E]">
                {isAdmin
                  ? "Creá el primero para incorporarlo al catálogo."
                  : "Un administrador debe asignarte como responsable."}
              </Text>
            </View>
          ) : (
            venues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                isAdmin={isAdmin}
                onPress={() =>
                  router.push({
                    pathname: "/manageVenue",
                    params: { venueId: venue.id },
                  })
                }
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
