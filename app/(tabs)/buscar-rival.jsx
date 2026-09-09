import { Redirect } from "expo-router";
import MatchmakingScreen from "../../src/features/matchmaking/screens/MatchmakingScreen";
import { useAuth } from "../../src/providers/AuthProvider";
import { isPlayer } from "../../src/utils/authorization";

export default function MatchmakingRoute() {
  const { user } = useAuth();

  if (!isPlayer(user?.role)) return <Redirect href="/perfil" />;

  return <MatchmakingScreen />;
}
