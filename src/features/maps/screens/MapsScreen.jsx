import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import useFavoriteVenues from "../../../hooks/useFavoriteVenues";
import {
  getMapSelection,
  saveMapSelection,
} from "../../../services/preferences";
import { venuesApi } from "../../../services/api";
import {
  addUruguayDays,
  nextUruguayHourSelection,
  uruguayDateKey,
} from "../../../utils/uruguayDateTime";
import MapsHeader from "../components/MapsHeader";
import VenuePreview from "../components/VenuePreview";

const INITIAL_REGION = {
  latitude: -34.897485940674585,
  longitude: -54.94943488276516,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};

function dateKey(date) {
  return uruguayDateKey(date);
}

function initialSelection() {
  return nextUruguayHourSelection();
}

function addDays(value, amount) {
  return addUruguayDays(value, amount);
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
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const { favoriteVenueIds, toggleFavoriteVenue } = useFavoriteVenues();

  useEffect(() => {
    getMapSelection()
      .then((saved) => {
        if (saved?.date >= dateKey(new Date())) setSelection(saved);
      })
      .finally(() => setPreferencesLoaded(true));
  }, []);

  useEffect(() => {
    if (preferencesLoaded) saveMapSelection(selection).catch(() => {});
  }, [preferencesLoaded, selection]);

  useFocusEffect(
    useCallback(() => {
      void reloadKey;
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
    }, [reloadKey]),
  );

  useFocusEffect(
    useCallback(() => {
      void reloadKey;
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
    }, [reloadKey, selection.date, selection.time]),
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
      const matchesFavorite =
        !onlyFavorites || favoriteVenueIds.includes(venue.id);
      return (
        matchesQuery &&
        matchesAvailability &&
        matchesFavorite &&
        coordinateOf(venue)
      );
    });
  }, [
    availabilityByVenue,
    favoriteVenueIds,
    onlyAvailable,
    onlyFavorites,
    query,
    venues,
  ]);

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
        onlyFavorites={onlyFavorites}
        onOnlyFavoritesChange={setOnlyFavorites}
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
          favorite={favoriteVenueIds.includes(selectedVenue.id)}
          onToggleFavorite={() => toggleFavoriteVenue(selectedVenue.id)}
        />
      )}

      {(venuesLoading || venuesError) && (
        <View
          accessibilityLiveRegion="assertive"
          className="absolute bottom-6 self-center rounded-xl border border-[#30363D] bg-[#17191C] px-4 py-3"
        >
          {venuesLoading ? (
            <ActivityIndicator color="#80D160" />
          ) : (
            <View className="items-center">
              <Text className="text-center text-[#F08A93]">{venuesError}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setReloadKey((value) => value + 1)}
                className="mt-3 min-h-12 items-center justify-center rounded-xl border border-[#653B40] px-5"
              >
                <Text className="font-semibold text-[#F08A93]">Reintentar</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
