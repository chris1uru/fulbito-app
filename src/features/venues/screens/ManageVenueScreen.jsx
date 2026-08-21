import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppAlert as Alert } from "../../../components/common/AppAlert";
import { useAuth } from "../../../providers/AuthProvider";
import { courtsApi, scheduleApi, venuesApi } from "../../../services/api";

const ACTIONS = [
  {
    key: "photos",
    title: "Fotos y portada",
    subtitle: "Elegí qué imágenes se muestran",
    icon: "images-outline",
  },
  {
    key: "courts",
    title: "Canchas",
    subtitle: "Precios, formatos y disponibilidad",
    icon: "football-outline",
  },
  {
    key: "hours",
    title: "Horarios",
    subtitle: "Días, turnos y bloqueos",
    icon: "time-outline",
  },
  {
    key: "reservations",
    title: "Reservas",
    subtitle: "Consultá la agenda del complejo",
    icon: "calendar-outline",
  },
];

function addressOf(location) {
  if (!location) return "Ubicación pendiente";
  const street = [location.street, location.streetNumber]
    .filter(Boolean)
    .join(" ");
  return [street, location.city, location.departmentName]
    .filter(Boolean)
    .join(", ");
}

export default function ManageVenueScreen() {
  const { venueId: rawVenueId } = useLocalSearchParams();
  const venueId = Array.isArray(rawVenueId) ? rawVenueId[0] : rawVenueId;
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user.role === "ADMIN";
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courtCount, setCourtCount] = useState(0);
  const [hoursCount, setHoursCount] = useState(0);

  const loadVenue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = isAdmin
        ? await venuesApi.adminOne(venueId)
        : (await venuesApi.mine()).find((item) => item.id === venueId);
      if (!data) throw new Error("El complejo no está asignado a tu cuenta.");
      setVenue(data);
      const [courts, hours] = await Promise.all([
        courtsApi.managedList(venueId).catch(() => []),
        scheduleApi.hours(venueId).catch(() => []),
      ]);
      setCourtCount(courts.length);
      setHoursCount(hours.length);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, venueId]);

  useFocusEffect(
    useCallback(() => {
      loadVenue();
    }, [loadVenue]),
  );

  function openAction(action) {
    if (action.key === "photos") {
      router.push({
        pathname: "/imageManagement",
        params: {
          target: "venue",
          targetId: venue.id,
          targetName: venue.name,
        },
      });
      return;
    }
    if (action.key === "courts") {
      router.push({
        pathname: "/courtManagement",
        params: { venueId: venue.id, venueName: venue.name },
      });
      return;
    }
    if (action.key === "hours") {
      router.push({
        pathname: "/scheduleManagement",
        params: { venueId: venue.id, venueName: venue.name },
      });
      return;
    }
    if (action.key === "reservations") {
      router.push("/reservas");
      return;
    }
  }

  function requestDeactivation() {
    Alert.alert(
      "Desactivar complejo",
      "El complejo dejará de publicarse, pero conservará sus canchas, reservas e historial.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desactivar",
          style: "destructive",
          onPress: async () => {
            try {
              const updated = await venuesApi.adminSetStatus(
                venue.id,
                "INACTIVE",
              );
              setVenue(updated);
              Alert.alert(
                "Complejo desactivado",
                "La baja lógica fue aplicada.",
              );
            } catch (requestError) {
              Alert.alert("No se pudo desactivar", requestError.message);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#17191C]">
        <ActivityIndicator size="large" color="#80D160" />
        <Text className="mt-3 text-[#A9B1B8]">Cargando gestión...</Text>
      </View>
    );
  }

  if (error || !venue) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#17191C" }}>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={42} color="#F08A93" />
          <Text className="mt-4 text-center text-xl font-semibold text-white">
            No pudimos abrir el complejo
          </Text>
          <Text className="mt-2 text-center text-[#A9B1B8]">{error}</Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 rounded-xl bg-[#80D160] px-6 py-3"
          >
            <Text className="font-semibold text-[#152012]">Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
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
          <Text className="text-xl font-bold text-white">
            Gestionar complejo
          </Text>
          <Text className="mt-0.5 text-sm text-[#8B949E]">{venue.name}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-10"
      >
        <View className="overflow-hidden rounded-3xl border border-[#30363D] bg-[#202428]">
          {venue.coverImageUrl ? (
            <Image
              source={{ uri: venue.coverImageUrl }}
              className="h-44 w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-36 items-center justify-center bg-[#18231F]">
              <Ionicons name="business-outline" size={42} color="#69727B" />
              <Text className="mt-2 text-sm text-[#8B949E]">Sin portada</Text>
            </View>
          )}
          <View className="p-5">
            <View className="flex-row items-start justify-between">
              <View className="mr-3 flex-1">
                <Text className="text-2xl font-bold text-white">
                  {venue.name}
                </Text>
                <Text className="mt-2 text-sm leading-5 text-[#A9B1B8]">
                  {addressOf(venue.location)}
                </Text>
              </View>
              <View className="rounded-full bg-[#142019] px-3 py-1.5">
                <Text className="text-xs font-semibold text-[#80D160]">
                  {venue.status === "ACTIVE" ? "Activo" : venue.status}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/venueForm",
                  params: { mode: "edit", venueId: venue.id },
                })
              }
              className="mt-5 flex-row items-center justify-center rounded-xl bg-[#80D160] py-3.5"
            >
              <Ionicons name="create-outline" size={19} color="#152012" />
              <Text className="ml-2 font-semibold text-[#152012]">
                Editar información
              </Text>
            </Pressable>

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1 rounded-xl bg-[#292D32] p-3">
                <Text className="text-2xl font-bold text-white">
                  {courtCount}
                </Text>
                <Text className="mt-1 text-xs text-[#8B949E]">
                  canchas publicadas
                </Text>
              </View>
              <View className="flex-1 rounded-xl bg-[#292D32] p-3">
                <Text className="text-2xl font-bold text-white">
                  {hoursCount}
                </Text>
                <Text className="mt-1 text-xs text-[#8B949E]">
                  franjas semanales
                </Text>
              </View>
            </View>

            {venue.status === "ACTIVE" && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/venueLayout",
                    params: { venueId: venue.id },
                  })
                }
                className="mt-3 flex-row items-center justify-center rounded-xl border border-[#3B4249] py-3.5"
              >
                <Ionicons name="eye-outline" size={19} color="#C5CBD1" />
                <Text className="ml-2 font-semibold text-[#C5CBD1]">
                  Ver como jugador
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <Text className="mb-3 mt-7 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
          Administración
        </Text>
        <View className="overflow-hidden rounded-2xl border border-[#30363D] bg-[#202428]">
          {ACTIONS.map((action, index) => (
            <View key={action.key}>
              {index > 0 && <View className="mx-4 h-px bg-[#30363D]" />}
              <Pressable
                onPress={() => openAction(action)}
                className="flex-row items-center px-4 py-4"
              >
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-[#292D32]">
                  <Ionicons name={action.icon} size={21} color="#80D160" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-white">
                    {action.title}
                  </Text>
                  <Text className="mt-1 text-xs text-[#8B949E]">
                    {action.subtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#69727B" />
              </Pressable>
            </View>
          ))}
        </View>

        {isAdmin && (
          <>
            <Text className="mb-3 mt-7 text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
              Control administrativo
            </Text>
            <View className="rounded-2xl border border-[#30363D] bg-[#202428] p-4">
              <View className="flex-row items-center">
                <Ionicons name="person-outline" size={20} color="#A9B1B8" />
                <View className="ml-3 flex-1">
                  <Text className="text-xs text-[#8B949E]">
                    Responsable asignado
                  </Text>
                  <Text className="mt-1 text-sm font-medium text-white">
                    {venue.owner
                      ? `${venue.owner.firstName} ${venue.owner.lastName}`
                      : "Sin responsable"}
                  </Text>
                  {!!venue.owner?.nationalId && (
                    <Text className="mt-1 text-xs text-[#69727B]">
                      Cédula {venue.owner.nationalId}
                    </Text>
                  )}
                </View>
              </View>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/venueForm",
                    params: { mode: "edit", venueId: venue.id },
                  })
                }
                className="mt-4 items-center rounded-xl border border-[#3B4249] py-3"
              >
                <Text className="font-semibold text-[#C5CBD1]">
                  Cambiar responsable
                </Text>
              </Pressable>
              <Pressable
                onPress={requestDeactivation}
                className="mt-3 items-center rounded-xl border border-[#653B40] bg-[#2B2225] py-3"
              >
                <Text className="font-semibold text-[#F08A93]">
                  Desactivar complejo
                </Text>
              </Pressable>
              <Text className="mt-3 text-center text-xs leading-4 text-[#69727B]">
                No se elimina información ni historial de reservas.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
