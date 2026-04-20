import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    async function bootstrap() {
      try {
        const storedToken = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

        if (!storedToken) {
          return;
        }

        setAuthToken(storedToken);
        const currentUser = await fetchMe();
        setToken(storedToken);
        setUser(currentUser);
      } catch (error) {
        setAuthToken(null);
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        setIsBootstrapping(false);
      }
    }

    bootstrap();
  }, []);

  async function persistSession(nextToken, nextUser) {
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, nextToken);
  }

  async function register(payload) {
    try {
      const result = await registerAccount(payload);
      await persistSession(result.token, result.user);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }

  async function login(payload) {
    try {
      const result = await loginAccount(payload);
      await persistSession(result.token, result.user);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }

  async function refreshUser() {
    try {
      const currentUser = await fetchMe();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }

  async function logout() {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token),
        isBootstrapping,
        login,
        logout,
        refreshUser,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
