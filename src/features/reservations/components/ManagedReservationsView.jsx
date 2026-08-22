import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { courtsApi, reservationsApi, venuesApi } from "../../../services/api";
import AdminVenueSelector from "./AdminVenueSelector";
import ReservationManagementList from "./ReservationManagementList";

export default function ManagedReservationsView({ isAdmin }) {
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();
  const agendaRequestId = useRef(0);
  const [venues, setVenues] = useState([]);
  const [courts, setCourts] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [periodDate, setPeriodDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState("DAY");
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(isAdmin);
  const [agendaLoading, setAgendaLoading] = useState(!isAdmin);
  const [error, setError] = useState("");
  const [agendaError, setAgendaError] = useState("");
  const [query, setQuery] = useState("");
  const [venueFilter, setVenueFilter] = useState("ALL");
  const [courtFilter, setCourtFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadVenues = useCallback(async () => {
    if (isAdmin) setLoading(true);
    setError("");

    try {
      const data = isAdmin
        ? await venuesApi.adminList()
        : await venuesApi.mine();
      setVenues(data);
      if (isAdmin) return;

      setVenueFilter(data[0]?.id ?? "ALL");
      setCourtFilter("ALL");

      const courtsByVenue = await Promise.all(
        data.map(async (venue) => {
          const venueCourts = await courtsApi.managedList(venue.id);
          return venueCourts.map((court) => ({
            ...court,
            venueId: venue.id,
            venueName: venue.name,
          }));
        }),
      );
      setCourts(courtsByVenue.flat());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useFocusEffect(
    useCallback(() => {
      loadVenues();
    }, [loadVenues]),
  );

  const loadAgenda = useCallback(async () => {
    if (isAdmin && !selectedVenue) return;

    const from =
      viewMode === "DAY"
        ? new Date(
            periodDate.getFullYear(),
            periodDate.getMonth(),
            periodDate.getDate(),
          )
        : new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
    const to =
      viewMode === "DAY"
        ? new Date(
            periodDate.getFullYear(),
            periodDate.getMonth(),
            periodDate.getDate() + 1,
          )
        : new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 1);
    const requestId = ++agendaRequestId.current;
    setAgendaLoading(true);
    setAgendaError("");

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
      if (requestId !== agendaRequestId.current) return;

      setReservations(
        selectedVenue
          ? data.filter(
              (reservation) => reservation.venueId === selectedVenue.id,
            )
          : data,
      );
      if (venueCourts) {
        setCourts(
          venueCourts.map((court) => ({
            ...court,
            venueId: selectedVenue.id,
          })),
        );
      }
    } catch (requestError) {
      if (requestId === agendaRequestId.current) {
        setAgendaError(requestError.message);
      }
    } finally {
      if (requestId === agendaRequestId.current) {
        setAgendaLoading(false);
      }
    }
  }, [isAdmin, periodDate, selectedVenue, viewMode]);

  useFocusEffect(
    useCallback(() => {
      loadAgenda();
    }, [loadAgenda]),
  );

  function changePeriod(offset) {
    setPeriodDate((current) =>
      viewMode === "DAY"
        ? new Date(
            current.getFullYear(),
            current.getMonth(),
            current.getDate() + offset,
          )
        : new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  function changeViewMode(mode) {
    setViewMode(mode);
    setPeriodDate(new Date());
  }

  function selectVenue(venue) {
    setAgendaLoading(true);
    setSelectedVenue(venue);
    setReservations([]);
    setQuery("");
    setCourtFilter("ALL");
    setPaymentFilter("ALL");
    setStatusFilter("ALL");
  }

  function clearSelectedVenue() {
    agendaRequestId.current += 1;
    setSelectedVenue(null);
    setAgendaLoading(false);
    setAgendaError("");
    setCourtFilter("ALL");
  }

  function changeVenueFilter(venueId) {
    setVenueFilter(venueId);
    setCourtFilter("ALL");
  }

  const choosingVenue = isAdmin && !selectedVenue;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#17191C" }}
      edges={["top"]}
    >
      <View
        className="flex-1 bg-[#17191C]"
        style={{
          paddingTop: 16,
          paddingHorizontal: 12,
        }}
      >
        <View className="pb-5">
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
            contentContainerStyle={{ paddingBottom: bottom + 156 }}
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

            <View className="mx-4 mb-3 flex-row rounded-xl bg-[#202428] p-1">
              {[
                ["DAY", "Día"],
                ["MONTH", "Mes"],
              ].map(([mode, label]) => (
                <Pressable
                  key={mode}
                  onPress={() => changeViewMode(mode)}
                  className={`flex-1 items-center rounded-lg py-2.5 ${
                    viewMode === mode ? "bg-[#2C4930]" : ""
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      viewMode === mode ? "text-[#80D160]" : "text-[#8B949E]"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="mx-4 mb-4 flex-row items-center justify-between rounded-xl border border-[#30363D] bg-[#202428] p-2">
              <Pressable
                onPress={() => changePeriod(-1)}
                className="h-9 w-9 items-center justify-center rounded-lg bg-[#292D32]"
              >
                <Ionicons name="chevron-back" size={18} color="#A9B1B8" />
              </Pressable>
              <View className="items-center">
                <Text className="text-xs text-[#8B949E]">
                  {viewMode === "DAY" ? "Agenda del día" : "Agenda mensual"}
                </Text>
                <Text className="mt-0.5 font-semibold capitalize text-white">
                  {periodDate.toLocaleDateString("es-UY", {
                    ...(viewMode === "DAY"
                      ? { weekday: "short", day: "numeric", month: "long" }
                      : { month: "long", year: "numeric" }),
                  })}
                </Text>
              </View>
              <Pressable
                onPress={() => changePeriod(1)}
                className="h-9 w-9 items-center justify-center rounded-lg bg-[#292D32]"
              >
                <Ionicons name="chevron-forward" size={18} color="#A9B1B8" />
              </Pressable>
            </View>

            <ReservationManagementList
              reservations={reservations}
              venues={venues}
              courts={courts}
              venueFilter={selectedVenue?.id ?? venueFilter}
              onVenueFilterChange={changeVenueFilter}
              showVenueFilter={!isAdmin && venues.length > 1}
              query={query}
              onQueryChange={setQuery}
              courtFilter={courtFilter}
              onCourtFilterChange={setCourtFilter}
              paymentFilter={paymentFilter}
              onPaymentFilterChange={setPaymentFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              loading={agendaLoading}
              error={agendaError}
              onRetry={loadAgenda}
              onReservationPress={(reservation) =>
                router.push({
                  pathname: "/reservaDetail",
                  params: { reservationId: reservation.id },
                })
              }
            />
          </ScrollView>
        )}

        {!loading && !error && !choosingVenue && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/manualReservation",
                params: selectedVenue?.id
                  ? { venueId: selectedVenue.id }
                  : undefined,
              })
            }
            className="absolute right-6 z-10 h-14 w-14 items-center justify-center rounded-2xl border border-[#A4E88B] bg-[#80D160]"
            style={{ bottom: bottom + 76 }}
            accessibilityRole="button"
            accessibilityLabel="Nueva reserva manual"
          >
            <Ionicons name="add" size={28} color="#152012" />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
