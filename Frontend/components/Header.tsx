import React from "react";
import { View, TouchableOpacity } from "react-native";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import tw from "twrnc";

type HeaderProps = {
  onBack?: () => void;
  onClose?: () => void;
  goToProfile?: boolean;
};

const Header: React.FC<HeaderProps> = ({ onBack, onClose, goToProfile }) => {
  return (
    <View style={tw`h-auto flex-row justify-between`}>
      {/* Back Icon */}
      <View style={tw`w-auto items-center justify-center ml-4 mt-2`}>
        {onBack && (
          <TouchableOpacity onPress={onBack}>
            {goToProfile ? (
              <FontAwesome name="user-circle" size={40} color="#2563eb" />
            ) : (
              <AntDesign name="arrowleft" size={24} color="#111827" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Spacer */}
      <View style={tw`w-[80%] items-center justify-center px-16`} />

      {/* Close Icon */}
      <View style={tw`w-[10%] items-center justify-center`}>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <AntDesign name="close" size={24} color={"#111827"} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Header;
