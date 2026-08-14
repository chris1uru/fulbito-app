import { useState } from "react";
import MapView, { Marker } from "react-native-maps";
import MapsHeader from "../../components/MapsHeader";


export default function Maps() {
  return (
    <>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: -34.9,
          longitude: -56.16,
          latitudeDelta: 0.11,
          longitudeDelta: 0.11,
        }}
      >
       
      </MapView>

      <MapsHeader/>
 
    </>
  );
}
