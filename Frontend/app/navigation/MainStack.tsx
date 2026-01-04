import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Dashboard from "../dashboard/Dashboard";
import Products from "../dashboard/Products";
import Benches from "../dashboard/Benches";
import Reservations from "../dashboard/Reservations";

const Stack = createNativeStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
        animation: "none",
      }}
      initialRouteName="Dashboard"
    >
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="Products" component={Products} />
      <Stack.Screen name="Benches" component={Benches} />
      <Stack.Screen name="Reservations" component={Reservations} />
    </Stack.Navigator>
  );
};

export default MainStack;
