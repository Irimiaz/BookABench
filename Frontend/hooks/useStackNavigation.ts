import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ParamListBase } from "@react-navigation/routers";

export default function useStackNavigation<
  StackParamList extends ParamListBase
>() {
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>();

  function goToScreen<T extends keyof StackParamList>(
    screenName: T,
    params?: StackParamList[T]
  ) {
    navigation.navigate(screenName as any, params as any);
  }

  function goBack() {
    navigation.goBack();
  }

  return { goToScreen, goBack };
}
