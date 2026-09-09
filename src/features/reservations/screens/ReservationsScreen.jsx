import { Redirect } from "expo-router";
import { useAuth } from "../../../providers/AuthProvider";
import ManagedReservationsView from "../components/ManagedReservationsView";
import PlayerReservationsView from "../components/PlayerReservationsView";
import { isManager, isPlayer } from "../../../utils/authorization";

export default function ReservationsScreen() {
  const { user } = useAuth();

  if (isPlayer(user?.role)) return <PlayerReservationsView />;
  if (isManager(user?.role)) {
    return <ManagedReservationsView isAdmin={user.role === "ADMIN"} />;
  }

  return <Redirect href="/perfil" />;
}
