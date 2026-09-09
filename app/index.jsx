import { Redirect } from "expo-router";
import { useAuth } from "../src/providers/AuthProvider";

export default function Index() {
  const { user, needsOnboarding } = useAuth();

  if (!user) return <Redirect href="/loginScreen" />;
  if (needsOnboarding) return <Redirect href="/welcome" />;

  return <Redirect href={user?.role === "OWNER" ? "/reservas" : "/maps"} />;
}
