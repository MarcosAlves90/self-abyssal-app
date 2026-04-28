import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/tokens";
import { AuthScreen } from "../screens/AuthScreen";
import { CartScreen } from "../screens/CartScreen";
import { DishDetailsScreen } from "../screens/DishDetailsScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MenuScreen } from "../screens/MenuScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { DeliveryCheckoutScreen } from "../screens/DeliveryCheckoutScreen";
import { ReservationScreen } from "../screens/ReservationScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function iconForRoute(routeName, color, size) {
  const iconMap = {
    Inicio: "waves",
    Menu: "silverware-fork-knife",
    Reserva: "calendar-star",
    Perfil: "account-circle-outline",
  };

  return (
    <MaterialCommunityIcons
      color={color}
      name={iconMap[routeName]}
      size={size}
    />
  );
}

function TabBarBackground() {
  return (
    <LinearGradient
      colors={[
        "rgba(7, 18, 38, 0.98)",
        "rgba(9, 24, 46, 0.98)",
        "rgba(4, 11, 23, 0.99)",
      ]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={StyleSheet.absoluteFillObject}
    />
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.warning,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarBackground: TabBarBackground,
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          paddingBottom: 4,
          paddingTop: 4,
        },
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopColor: "rgba(255, 217, 138, 0.16)",
          borderTopWidth: 1,
          height: 84,
          elevation: 0,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fonts.body,
          fontSize: 11,
          letterSpacing: 0.4,
        },
        tabBarIconStyle: {
          marginTop: 1,
        },
        tabBarIcon: ({ color, size }) => iconForRoute(route.name, color, size),
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
          backgroundColor: theme.colors.background,
        },
        headerBackTitleVisible: false,
        headerStyle: {
          backgroundColor: theme.colors.backgroundAlt,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: theme.fonts.bodyBold,
        },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen
            component={MainTabs}
            name="MainTabs"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            component={DishDetailsScreen}
            name="DishDetails"
            options={{ title: "Detalhes do prato" }}
          />
          <Stack.Screen
            component={CartScreen}
            name="Cart"
            options={{ title: "Carrinho" }}
          />
          <Stack.Screen
            component={DeliveryCheckoutScreen}
            name="DeliveryCheckout"
            options={{ title: "Finalizar delivery" }}
          />
        </>
      ) : (
        <Stack.Screen
          component={AuthScreen}
          name="Auth"
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
