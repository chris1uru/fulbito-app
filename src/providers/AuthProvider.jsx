import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authApi, setApiToken, setUnauthorizedHandler } from "../services/api";
import { getToken, removeToken, saveToken } from "../services/session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      setApiToken(null);
      setUser(null);
      await removeToken();
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    getToken()
      .then(async (token) => {
        if (!token) return;
        setApiToken(token);
        setUser(await authApi.me());
      })
      .catch(signOut)
      .finally(() => setLoading(false));
  }, []);

  async function authenticate(action, values) {
    const session = await action(values);
    setApiToken(session.accessToken);
    await saveToken(session.accessToken);
    setUser(session.user);
  }

  async function signOut() {
    setApiToken(null);
    setUser(null);
    await removeToken();
  }

  async function updateProfile(values) {
    const updatedUser = await authApi.updateMe(values);
    setUser(updatedUser);
    return updatedUser;
  }

  const refreshUser = useCallback(async () => {
    const updatedUser = await authApi.me();
    setUser(updatedUser);
    return updatedUser;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: (v) => authenticate(authApi.login, v),
        signUp: (v) => authenticate(authApi.registerPlayer, v),
        updateProfile,
        refreshUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
