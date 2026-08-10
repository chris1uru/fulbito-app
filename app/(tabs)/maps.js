import MapView from "react-native-maps";

export default function Maps() {
    return (
        <MapView
            style={{ flex: 1 }}
            initialRegion={{
                latitude: -34.9,
                longitude: -54.95,
                latitudeDelta: 0.09,
                longitudeDelta: 0.04,
            }}
        />
    );
}
