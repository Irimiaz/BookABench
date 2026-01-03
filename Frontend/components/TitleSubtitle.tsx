import React from "react";
import { View, Text } from "react-native";
import tw from "twrnc";

type TitleSubtitleProps = {
  title: string;
  subtitle?: string;
};
const TitleSubtitle: React.FC<TitleSubtitleProps> = ({ title, subtitle }) => {
  return (
    <View style={tw`mt-6 `}>
      {/* Title */}
      <Text style={tw`text-center text-black text-3xl  `}>{title}</Text>
      {/* Spacing and Subtitle */}
      {subtitle && (
        <>
          <View style={tw`h-5`} />
          <Text style={tw`text-center text-black text-base font-normal `}>
            {subtitle}
          </Text>
        </>
      )}
    </View>
  );
};

export default TitleSubtitle;
