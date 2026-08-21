import { Redirect } from "expo-router";
import MapsScreen from "../../src/features/maps/screens/MapsScreen";
import { useAuth } from "../../src/providers/AuthProvider";

export default function MapsRoute() {
  const { user } = useAuth();

  if (user?.role === "OWNER") return <Redirect href="/reservas" />;

  return <MapsScreen />;
}
