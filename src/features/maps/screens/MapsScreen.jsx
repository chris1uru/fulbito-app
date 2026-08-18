import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapsHeader from "../components/MapsHeader";
import { venuesApi } from "../../../services/api";
import VenuePreview from "../components/VenuePreview";

export default function MapsScreen() {
  const [venues, setVenues] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);

  useEffect(() => {
    venuesApi
      .publicList()
      .then(setVenues)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      <MapsHeader />
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: -34.897485940674585,
          longitude: -54.94943488276516,
          latitudeDelta: 0.09,
          longitudeDelta: 0.09,
        }}
      >
        {venues.map((venue) => (
          <Marker
            key={venue.id}
            coordinate={{
              latitude: Number(venue.location.latitude),
              longitude: Number(venue.location.longitude),
            }}
            onPress={() => setSelectedVenue(venue)}
            pinColor="green"
          />
        ))}
      </MapView>

      {selectedVenue && (
        <VenuePreview
          venue={selectedVenue}
          onClose={() => setSelectedVenue(null)}
        />
      )}

      {(loading || error) && (
        <View className="absolute bottom-6 self-center rounded-xl bg-slate-900 px-4 py-3">
          {loading ? (
            <ActivityIndicator color="#80D160" />
          ) : (
            <Text className="text-white">{error}</Text>
          )}
        </View>
      )}
    </>
  );
}
