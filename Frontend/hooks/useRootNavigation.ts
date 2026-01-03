import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";

export default function useRootNavigation() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  function goToStack<T extends keyof RootStackParamList>(
    stackName: T,
    params?: RootStackParamList[T]
  ) {
    navigation.navigate({ name: stackName, params } as any);
  }

  const goBack = () => navigation.goBack();

  return { goToStack, goBack };
}
