import React from "react";
import { View, StyleSheet } from "react-native";
import tw from "twrnc";
import TitleSubtitle from "./TitleSubtitle";
import Header from "./Header";

type BaseScreenProps = {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
  goToProfile?: boolean;
  children: React.ReactNode;
};

const BaseScreen: React.FC<BaseScreenProps> = ({
  title,
  subtitle,
  onBack,
  onClose,
  children,
  goToProfile,
}) => {
  return (
    <View style={styles.container}>
      {/* 2) Foreground content */}
      <View style={tw`flex-1 px-4 mt-3 bg-white`}>
        {(onBack || onClose) && (
          <Header onBack={onBack} onClose={onClose} goToProfile={goToProfile} />
        )}

        {title && <TitleSubtitle title={title} subtitle={subtitle} />}

        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default BaseScreen;
