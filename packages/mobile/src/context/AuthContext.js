import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PropTypes from "prop-types";

import {
  fetchMe,
  getApiErrorMessage,
  loginAccount,
  registerAccount,
  setAuthToken
} from "../services/api";

const SESSION_STORAGE_KEY = "@abyssal/session";
const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const storedToken = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

        if (!storedToken) {
          return;
        }

        setAuthToken(storedToken);
        const currentUser = await fetchMe();
        if (!isMounted) {
          return;
        }
        setToken(storedToken);
        setUser(currentUser);
      } catch {
        setAuthToken(null);
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        console.warn("Auth bootstrap failed. Session state was reset.");
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistSession = useCallback(async (nextToken, nextUser) => {
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, nextToken);
  }, []);

  const register = useCallback(async (payload) => {
    try {
      const result = await registerAccount(payload);
      await persistSession(result.token, result.user);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }, [persistSession]);

  const login = useCallback(async (payload) => {
    try {
      const result = await loginAccount(payload);
      await persistSession(result.token, result.user);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }, [persistSession]);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await fetchMe();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: Boolean(token),
    isBootstrapping,
    login,
    logout,
    refreshUser,
    register
  }), [
    isBootstrapping,
    login,
    logout,
    refreshUser,
    register,
    token,
    user
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
