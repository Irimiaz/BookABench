import React from "react";
import { View, Text } from "react-native";
import tw from "twrnc";

type TitleSubtitleProps = {
  title: string;
  subtitle?: string;
};
const TitleSubtitle: React.FC<TitleSubtitleProps> = ({ title, subtitle }) => {
  return (
    <View style={tw`mt-4 mb-8`}>
      {/* Title */}
      <Text style={tw`text-center text-5xl font-bold tracking-tight text-gray-900 mb-3`}>{title}</Text>
      {/* Subtitle */}
      {subtitle && (
        <Text style={tw`text-center text-gray-600 text-lg`}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

export default TitleSubtitle;
