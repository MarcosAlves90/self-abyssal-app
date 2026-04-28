import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/tokens";
import { AuthScreen } from "../screens/AuthScreen";
import { CartScreen } from "../screens/CartScreen";
import { DishDetailsScreen } from "../screens/DishDetailsScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MenuScreen } from "../screens/MenuScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ReservationScreen } from "../screens/ReservationScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function iconForRoute(routeName, color, size) {
  const iconMap = {
    Inicio: "waves",
    Menu: "fishbowl",
    Reserva: "calendar-month",
    Perfil: "account-circle"
  };

  return (
    <MaterialCommunityIcons
      color={color}
      name={iconMap[routeName]}
      size={size}
    />
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: "#061121",
          borderTopColor: theme.colors.border,
          height: 82,
          paddingBottom: 12,
          paddingTop: 12
        },
        tabBarLabelStyle: {
          fontFamily: theme.fonts.body,
          fontSize: 12
        },
        tabBarIcon: ({ color, size }) => iconForRoute(route.name, color, size)
      })}
    >
      <Tabs.Screen component={HomeScreen} name="Inicio" />
      <Tabs.Screen component={MenuScreen} name="Menu" />
      <Tabs.Screen component={ReservationScreen} name="Reserva" />
      <Tabs.Screen component={ProfileScreen} name="Perfil" />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: {
          backgroundColor: theme.colors.background
        },
        headerBackTitleVisible: false,
        headerStyle: {
          backgroundColor: theme.colors.backgroundAlt
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: theme.fonts.bodyBold
        }
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen component={MainTabs} name="MainTabs" options={{ headerShown: false }} />
          <Stack.Screen
            component={DishDetailsScreen}
            name="DishDetails"
            options={{ title: "Detalhes do prato" }}
          />
          <Stack.Screen component={CartScreen} name="Cart" options={{ title: "Carrinho" }} />
        </>
      ) : (
        <Stack.Screen component={AuthScreen} name="Auth" options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}
