import { Redirect } from "expo-router";
import { useAuth } from "../src/providers/AuthProvider";

export default function Index() {
  const { user } = useAuth();

  return <Redirect href={user?.role === "OWNER" ? "/reservas" : "/maps"} />;
}
