import React from "react";
import SkeletonLoading from "expo-skeleton-loading";
import { View } from "react-native";
import tw from "twrnc";

const Skeleton = () => {
  return (
    // @ts-ignore
    <SkeletonLoading background={"lightgrey"} highlight={"white"}>
      {/* <View style={{ flexDirection: "row", justifyContent: "space-between" }}> */}
      <View style={tw`items-center flex-col`}>
        <View style={tw`h-12 w-2/4 bg-slate-300 rounded-xl mb-12`} />
        <View style={tw`h-[3.125rem] w-3/4 bg-slate-300 rounded-xl m-2`} />
        <View style={tw`h-[3.125rem] w-3/4 bg-slate-300 rounded-xl m-2`} />
        <View style={tw`h-[3.125rem] w-3/4 bg-slate-300 rounded-xl m-2`} />
        {/* <View style={tw`h-[3.125rem] w-3/4 bg-slate-300 rounded-xl m-2`} /> */}
      </View>
    </SkeletonLoading>
  );
};

export default Skeleton;
