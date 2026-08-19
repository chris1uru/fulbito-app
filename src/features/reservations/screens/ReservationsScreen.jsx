import { useAuth } from "../../../providers/AuthProvider";
import ManagedReservationsView from "../components/ManagedReservationsView";
import PlayerReservationsView from "../components/PlayerReservationsView";

export default function ReservationsScreen() {
  const { user } = useAuth();

  if (user.role === "PLAYER") return <PlayerReservationsView />;

  return <ManagedReservationsView isAdmin={user.role === "ADMIN"} />;
}
