import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authApi, setApiToken, setUnauthorizedHandler } from "../services/api";
import {
  getToken,
  hasCompletedOnboarding,
  removeToken,
  saveOnboardingCompleted,
  saveToken,
} from "../services/session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      setApiToken(null);
      setUser(null);
      setNeedsOnboarding(false);
      await removeToken();
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    getToken()
      .then(async (token) => {
        if (!token) return;
        setApiToken(token);
        const restoredUser = await authApi.me();
        setUser(restoredUser);
        setNeedsOnboarding(
          restoredUser.role === "PLAYER" &&
            !(await hasCompletedOnboarding(restoredUser.id)),
        );
      })
      .catch(signOut)
      .finally(() => setLoading(false));
  }, []);

  async function authenticate(action, values, newAccount = false) {
    const session = await action(values);
    setApiToken(session.accessToken);
    await saveToken(session.accessToken);
    setUser(session.user);
    setNeedsOnboarding(
      session.user.role === "PLAYER" &&
        (newAccount || !(await hasCompletedOnboarding(session.user.id))),
    );
  }

  async function signOut() {
    try {
      await authApi.logout();
    } catch {
      // El cierre local siempre debe completarse, incluso sin conexión.
    } finally {
      setApiToken(null);
      setUser(null);
      setNeedsOnboarding(false);
      await removeToken();
    }
  }

  async function deleteAccount() {
    await authApi.deleteMe();
    setApiToken(null);
    setUser(null);
    setNeedsOnboarding(false);
    await removeToken();
  }

  async function changePassword(values) {
    await authApi.changePassword(values);
    setApiToken(null);
    setUser(null);
    setNeedsOnboarding(false);
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

  async function completeOnboarding() {
    if (!user) return;
    await saveOnboardingCompleted(user.id);
    setNeedsOnboarding(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        needsOnboarding,
        signIn: (v) => authenticate(authApi.login, v),
        signUp: (v) => authenticate(authApi.registerPlayer, v, true),
        completeOnboarding,
        updateProfile,
        refreshUser,
        signOut,
        deleteAccount,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
