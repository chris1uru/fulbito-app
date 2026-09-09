import { Redirect } from "expo-router";
import { useAuth } from "../src/providers/AuthProvider";
import { homeRouteForRole } from "../src/utils/authorization";

export default function Index() {
  const { user, needsOnboarding } = useAuth();

  if (!user) return <Redirect href="/loginScreen" />;
  if (needsOnboarding) return <Redirect href="/welcome" />;
  return <Redirect href={homeRouteForRole(user.role)} />;
}
