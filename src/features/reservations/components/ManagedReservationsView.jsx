import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { courtsApi, reservationsApi, venuesApi } from "../../../services/api";
import AdminVenueSelector from "./AdminVenueSelector";
import ReservationManagementList from "./ReservationManagementList";

export default function ManagedReservationsView({ isAdmin }) {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const [venues, setVenues] = useState([]);
  const [courts, setCourts] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(!isAdmin);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [courtFilter, setCourtFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("DATE");

  useEffect(() => {
    if (isAdmin) setLoading(true);
    const loadVenues = isAdmin ? venuesApi.adminList() : venuesApi.mine();

    loadVenues
      .then(async (data) => {
        setVenues(data);
        if (isAdmin) return;

        const courtsByVenue = await Promise.all(
          data.map(async (venue) => {
            const venueCourts = await courtsApi.managedList(venue.id);
            return venueCourts.map((court) => ({
              ...court,
              venueName: venue.name,
            }));
          }),
        );
        setCourts(courtsByVenue.flat());
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => {
        if (isAdmin) setLoading(false);
      });
  }, [isAdmin]);

  const loadAgenda = useCallback(async () => {
    if (isAdmin && !selectedVenue) return;

    const from = new Date(month.getFullYear(), month.getMonth(), 1);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    setLoading(true);
    setError("");

    try {
      const [data, venueCourts] = await Promise.all([
        reservationsApi.ownerAgenda(
          from.toISOString(),
          to.toISOString(),
          selectedVenue?.id,
        ),
        selectedVenue
          ? courtsApi.managedList(selectedVenue.id)
          : Promise.resolve(null),
      ]);
      setReservations(
        selectedVenue
          ? data.filter(
              (reservation) => reservation.venueId === selectedVenue.id,
            )
          : data,
      );
      if (venueCourts) setCourts(venueCourts);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, month, selectedVenue]);

  useFocusEffect(
    useCallback(() => {
      loadAgenda();
    }, [loadAgenda]),
  );

  function changeMonth(offset) {
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  function selectVenue(venue) {
    setLoading(true);
    setSelectedVenue(venue);
    setReservations([]);
    setQuery("");
    setCourtFilter("ALL");
    setPaymentFilter("ALL");
    setStatusFilter("ALL");
  }

  function clearSelectedVenue() {
    setSelectedVenue(null);
    setError("");
    setCourtFilter("ALL");
  }

  const choosingVenue = isAdmin && !selectedVenue;

  return (
    <View className="flex-1 bg-[#17191C]" style={{ paddingTop: top + 5 }}>
      <View className="px-4 pb-5 pt-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-3xl font-semibold text-white">
              {choosingVenue ? "Reservas" : "Agenda"}
            </Text>
            <Text numberOfLines={1} className="mt-1 text-sm text-[#A9B1B8]">
              {choosingVenue
                ? "Elegí el complejo que querés consultar"
                : selectedVenue?.name || "Reservas de tus complejos"}
            </Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#2C4930]">
            <Ionicons
              name={choosingVenue ? "business-outline" : "calendar-outline"}
              size={23}
              color="#80D160"
            />
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center pb-20">
          <ActivityIndicator color="#80D160" size="large" />
        </View>
      ) : error ? (
        <View className="mx-4 rounded-2xl border border-[#653B40] bg-[#2B2225] p-4">
          <Text className="text-center text-sm text-[#F08A93]">{error}</Text>
          {isAdmin && selectedVenue && (
            <Pressable
              onPress={clearSelectedVenue}
              className="mt-4 items-center rounded-xl bg-[#3A292D] py-3"
            >
              <Text className="font-semibold text-[#F08A93]">
                Cambiar complejo
              </Text>
            </Pressable>
          )}
        </View>
      ) : choosingVenue ? (
        <AdminVenueSelector venues={venues} onSelect={selectVenue} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottom + 88 }}
        >
          {isAdmin && (
            <Pressable
              onPress={clearSelectedVenue}
              className="mx-4 mb-3 flex-row items-center self-start rounded-lg bg-[#292D32] px-3 py-2"
            >
              <Ionicons name="arrow-back" size={16} color="#A9B1B8" />
              <Text className="ml-2 text-xs font-semibold text-[#A9B1B8]">
                Cambiar complejo
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/manualReservation",
                params: selectedVenue?.id
                  ? { venueId: selectedVenue.id }
                  : undefined,
              })
            }
            className="mx-4 mb-4 flex-row items-center justify-center rounded-xl bg-[#80D160] py-3.5"
          >
            <Ionicons name="add-circle-outline" size={20} color="#152012" />
            <Text className="ml-2 font-semibold text-[#152012]">
              Nueva reserva manual
            </Text>
          </Pressable>

          <View className="mx-4 mb-4 flex-row items-center justify-between rounded-xl border border-[#30363D] bg-[#202428] p-2">
            <Pressable
              onPress={() => changeMonth(-1)}
              className="h-9 w-9 items-center justify-center rounded-lg bg-[#292D32]"
            >
              <Ionicons name="chevron-back" size={18} color="#A9B1B8" />
            </Pressable>
            <View className="items-center">
              <Text className="text-xs text-[#8B949E]">Período</Text>
              <Text className="mt-0.5 font-semibold capitalize text-white">
                {month.toLocaleDateString("es-UY", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
            <Pressable
              onPress={() => changeMonth(1)}
              className="h-9 w-9 items-center justify-center rounded-lg bg-[#292D32]"
            >
              <Ionicons name="chevron-forward" size={18} color="#A9B1B8" />
            </Pressable>
          </View>

          <ReservationManagementList
            reservations={reservations}
            courts={courts}
            query={query}
            onQueryChange={setQuery}
            courtFilter={courtFilter}
            onCourtFilterChange={setCourtFilter}
            paymentFilter={paymentFilter}
            onPaymentFilterChange={setPaymentFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onReservationPress={(reservation) =>
              router.push({
                pathname: "/reservaDetail",
                params: { reservationId: reservation.id },
              })
            }
          />
        </ScrollView>
      )}
    </View>
  );
}
