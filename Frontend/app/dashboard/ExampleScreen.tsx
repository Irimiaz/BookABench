import React from "react";
import { View, Text } from "react-native";
import BaseScreen from "../../components/BaseScreen";
import useStackNavigation from "../../hooks/useStackNavigation";
import { MainStackParamList } from "../../types/navigation";
import tw from "twrnc";

export default function ExampleScreen() {
  const { goBack } = useStackNavigation<MainStackParamList>();

  return (
    <BaseScreen
      title="Example Screen"
      subtitle="This is an example screen using BaseScreen"
      onBack={goBack}
    >
      <View style={tw`flex-1 items-center justify-center p-4`}>
        <Text style={tw`text-lg text-gray-700 text-center`}>
          Example content goes here
        </Text>
      </View>
    </BaseScreen>
  );
}
