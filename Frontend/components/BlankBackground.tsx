import React, { ReactElement } from "react";
import { View } from "react-native";
import tw from "twrnc";

type Prop = {
  children: ReactElement;
};

const BlankBackground = ({ children }: Prop) => {
  return <View style={tw`flex-1  h-full`}>{children}</View>;
};

export default BlankBackground;
