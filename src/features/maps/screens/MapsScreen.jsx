import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { venuesApi } from "../../../services/api";
import MapsHeader from "../components/MapsHeader";
import VenuePreview from "../components/VenuePreview";

const INITIAL_REGION = {
  latitude: -34.897485940674585,
  longitude: -54.94943488276516,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeKey(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function initialSelection() {
  const nextHour = new Date();
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  const hour = nextHour.getHours();
  if (hour > 1 && hour < 10) nextHour.setHours(10);
  return { date: dateKey(nextHour), time: timeKey(nextHour) };
}

function addDays(value, amount) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function searchableVenueText(venue) {
  const location = venue.location ?? {};
  return normalize(
    [
      venue.name,
      venue.description,
      location.street,
      location.neighborhood,
      location.city,
      location.departmentName,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function coordinateOf(venue) {
  const latitude = Number(venue.location?.latitude);
  const longitude = Number(venue.location?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

export default function MapsScreen() {
  const mapRef = useRef(null);
  const [selection, setSelection] = useState(initialSelection);
  const [venues, setVenues] = useState([]);
  const [availabilityResponse, setAvailabilityResponse] = useState(null);
  const [venuesError, setVenuesError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [query, setQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setVenuesError("");
      setVenuesLoading(true);
      venuesApi
        .publicList()
        .then((data) => {
          if (active) setVenues(data);
        })
        .catch((requestError) => {
          if (active) setVenuesError(requestError.message);
        })
        .finally(() => {
          if (active) setVenuesLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setAvailabilityError("");
      setAvailabilityResponse(null);
      setAvailabilityLoading(true);
      venuesApi
        .availabilityHour(selection.date, selection.time)
        .then((data) => {
          if (active) setAvailabilityResponse(data);
        })
        .catch((requestError) => {
          if (active) setAvailabilityError(requestError.message);
        })
        .finally(() => {
          if (active) setAvailabilityLoading(false);
        });
      return () => {
        active = false;
      };
    }, [selection.date, selection.time]),
  );

  const availabilityByVenue = useMemo(
    () =>
      Object.fromEntries(
        (availabilityResponse?.venues ?? []).map((item) => [
          item.venueId,
          item,
        ]),
      ),
    [availabilityResponse],
  );

  const visibleVenues = useMemo(() => {
    const normalizedQuery = normalize(query);
    return venues.filter((venue) => {
      const matchesQuery =
        !normalizedQuery ||
        searchableVenueText(venue).includes(normalizedQuery);
      const availability = availabilityByVenue[venue.id];
      const matchesAvailability = !onlyAvailable || availability?.available;
      return matchesQuery && matchesAvailability && coordinateOf(venue);
    });
  }, [availabilityByVenue, onlyAvailable, query, venues]);

  useEffect(() => {
    if (!query.trim() || visibleVenues.length === 0) return;
    const coordinate = coordinateOf(visibleVenues[0]);
    if (!coordinate) return;
    mapRef.current?.animateToRegion(
      {
        ...coordinate,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      350,
    );
  }, [query, visibleVenues]);

  const selectedVenue = venues.find((venue) => venue.id === selectedVenueId);
  const selectedAvailability = selectedVenue
    ? availabilityByVenue[selectedVenue.id]
    : null;
  const today = dateKey(new Date());

  function changeDate(amount) {
    setSelection((current) => ({
      ...current,
      date: addDays(current.date, amount),
    }));
    setSelectedVenueId("");
  }

  function changeTime(time) {
    setSelection((current) => ({ ...current, time }));
    setSelectedVenueId("");
  }

  function selectDate(date) {
    setSelection((current) => ({ ...current, date }));
    setSelectedVenueId("");
  }

  return (
    <View className="flex-1 bg-[#080B0D]">
      <MapsHeader
        query={query}
        onQueryChange={setQuery}
        selectedDate={selection.date}
        canGoPrevious={selection.date > today}
        onPreviousDate={() => changeDate(-1)}
        onNextDate={() => changeDate(1)}
        onDateChange={selectDate}
        selectedTime={selection.time}
        onTimeChange={changeTime}
        onlyAvailable={onlyAvailable}
        onOnlyAvailableChange={setOnlyAvailable}
      />

      <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={INITIAL_REGION}>
        {visibleVenues.map((venue) => {
          const coordinate = coordinateOf(venue);
          const availability = availabilityByVenue[venue.id];
          const markerState =
            availabilityLoading || availabilityError
              ? "loading"
              : availability?.available
                ? "available"
                : "unavailable";
          const pinColor =
            markerState === "loading"
              ? "#D6A84B"
              : markerState === "available"
                ? "#80D160"
                : Platform.OS === "android"
                  ? "#E85D5D"
                  : "#69727B";
          return (
            <Marker
              key={venue.id}
              coordinate={coordinate}
              onPress={() => setSelectedVenueId(venue.id)}
              pinColor={pinColor}
            />
          );
        })}
      </MapView>

      {selectedVenue && (
        <VenuePreview
          venue={selectedVenue}
          availability={selectedAvailability}
          availabilityLoading={availabilityLoading}
          availabilityError={availabilityError}
          selectedDate={selection.date}
          selectedTime={selection.time}
          onClose={() => setSelectedVenueId("")}
        />
      )}

      {(venuesLoading || venuesError) && (
        <View className="absolute bottom-6 self-center rounded-xl bg-[#17191C] px-4 py-3">
          {venuesLoading ? (
            <ActivityIndicator color="#80D160" />
          ) : (
            <Text className="text-[#F08A93]">{venuesError}</Text>
          )}
        </View>
      )}
    </View>
  );
}
