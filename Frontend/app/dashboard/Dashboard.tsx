import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import BaseScreen from "../../components/BaseScreen";
import useStackNavigation from "../../hooks/useStackNavigation";
import { MainStackParamList } from "../../types/navigation";
import {
  register,
  login,
  type RegisterData,
  type LoginData,
} from "../../utils/apiHelpers";
import { setupSocketConnection } from "../../utils/socketHelpers";
import tw from "twrnc";

export default function Dashboard() {
  const { goToScreen } = useStackNavigation<MainStackParamList>();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [name, setName] = useState("");
  const [universityYear, setUniversityYear] = useState("");
  const [phone, setPhone] = useState("");
  const [universityName, setUniversityName] = useState("");

  // Collection name for subscription
  const [collectionName, setCollectionName] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const loginData: LoginData = { email, password };
      const response = await login(loginData);

      // Connect to socket and subscribe to the specified collection
      const collections = collectionName.trim() ? [collectionName.trim()] : [];
      setupSocketConnection(response.user._id, collections, (message) => {
        console.log("Received message from socket:", message);
      });

      // Navigate to Products screen
      goToScreen("Products");
    } catch (error: any) {
      setError(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (
      !name ||
      !email ||
      !password ||
      !universityYear ||
      !phone ||
      !universityName
    ) {
      setError("Please fill in all fields");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const registerData: RegisterData = {
        name,
        email,
        password,
        universityYear: parseInt(universityYear),
        phone,
        universityName,
      };
      const response = await register(registerData);
      setIsLogin(true);
    } catch (error: any) {
      setError(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseScreen
      title="Dashboard"
      subtitle={isLogin ? "Login to continue" : "Create an account"}
    >
      <View style={tw`flex-1 items-center justify-center p-4`}>
        <View style={tw`w-full max-w-md`}>
          {/* Toggle between Login and Register */}
          <View style={tw`flex-row mb-6`}>
            <TouchableOpacity
              style={tw`flex-1 py-3 px-4 ${
                isLogin ? "bg-blue-500" : "bg-gray-200"
              } rounded-l-lg`}
              onPress={() => setIsLogin(true)}
            >
              <Text
                style={tw`text-center font-semibold ${
                  isLogin ? "text-white" : "text-gray-600"
                }`}
              >
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 py-3 px-4 ${
                !isLogin ? "bg-blue-500" : "bg-gray-200"
              } rounded-r-lg`}
              onPress={() => setIsLogin(false)}
            >
              <Text
                style={tw`text-center font-semibold ${
                  !isLogin ? "text-white" : "text-gray-600"
                }`}
              >
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error message */}
          {error ? (
            <View
              style={tw`bg-red-100 border border-red-400 rounded-lg p-3 mb-4`}
            >
              <Text style={tw`text-red-700 text-center`}>{error}</Text>
            </View>
          ) : null}

          {/* Register fields */}
          {!isLogin && (
            <>
              <TextInput
                style={tw`w-full bg-white border border-gray-300 rounded-lg px-4 py-3 mb-3`}
                placeholder="Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <TextInput
                style={tw`w-full bg-white border border-gray-300 rounded-lg px-4 py-3 mb-3`}
                placeholder="University Name"
                value={universityName}
                onChangeText={setUniversityName}
                autoCapitalize="words"
              />
              <TextInput
                style={tw`w-full bg-white border border-gray-300 rounded-lg px-4 py-3 mb-3`}
                placeholder="University Year"
                value={universityYear}
                onChangeText={setUniversityYear}
                keyboardType="numeric"
              />
              <TextInput
                style={tw`w-full bg-white border border-gray-300 rounded-lg px-4 py-3 mb-3`}
                placeholder="Phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </>
          )}

          {/* Common fields */}
          <TextInput
            style={tw`w-full bg-white border border-gray-300 rounded-lg px-4 py-3 mb-3`}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={tw`w-full bg-white border border-gray-300 rounded-lg px-4 py-3 mb-3`}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Collection name input */}
          <TextInput
            style={tw`w-full bg-white border border-gray-300 rounded-lg px-4 py-3 mb-4`}
            placeholder="Collection name to subscribe (e.g., products)"
            value={collectionName}
            onChangeText={setCollectionName}
            autoCapitalize="none"
          />

          {/* Submit button */}
          <TouchableOpacity
            style={tw`w-full bg-blue-500 rounded-lg py-3 items-center justify-center`}
            onPress={isLogin ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={tw`text-white font-semibold text-lg`}>
                {isLogin ? "Login" : "Register"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BaseScreen>
  );
}
