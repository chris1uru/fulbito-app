import { Redirect } from "expo-router";
import { useAuth } from "../../src/providers/AuthProvider";
import VenueManagementScreen from "../../src/features/venues/screens/VenueManagementScreen";

export default function OwnerVenuesRoute() {
  const { user } = useAuth();

  if (user?.role !== "OWNER") return <Redirect href="/maps" />;

  return <VenueManagementScreen embeddedInTabs />;
}
