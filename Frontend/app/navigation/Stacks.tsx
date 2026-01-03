import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import MainStack from "./MainStack";

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function Stacks() {
  return (
    <RootStack.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
        animation: "none",
      }}
      initialRouteName={"MainStack"}
    >
      <RootStack.Screen name="MainStack" component={MainStack} />
    </RootStack.Navigator>
  );
}
