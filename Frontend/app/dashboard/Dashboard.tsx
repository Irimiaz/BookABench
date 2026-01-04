import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import BaseScreen from "../../components/BaseScreen";
import useStackNavigation from "../../hooks/useStackNavigation";
import { MainStackParamList } from "../../types/navigation";
import {
  register,
  login,
  type RegisterData,
  type LoginData,
} from "../../utils/apiHelpers";
import {
  setupSocketConnection,
  subscribeToChanges,
} from "../../utils/socketHelpers";
import { useAuth } from "../../contexts/AuthContext";
import tw from "twrnc";

const InputField = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  showPasswordToggle = false,
  onTogglePassword,
}: any) => {
  return (
    <View style={tw`mb-4`}>
      <View
        style={tw`flex-row items-center bg-white border-2 border-gray-200 rounded-xl px-4 py-3.5 shadow-sm`}
      >
        <View style={tw`mr-3`}>
          {React.createElement(icon.type, {
            name: icon.name,
            size: 20,
            color: "#6b7280",
          })}
        </View>
        <TextInput
          style={tw`flex-1 text-gray-900 text-base`}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
        {showPasswordToggle && (
          <TouchableOpacity onPress={onTogglePassword} style={tw`ml-2`}>
            <Ionicons
              name={secureTextEntry ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function Dashboard() {
  const { goToScreen } = useStackNavigation<MainStackParamList>();
  const { setUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [name, setName] = useState("");
  const [universityYear, setUniversityYear] = useState("");
  const [phone, setPhone] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [teacherID, setTeacherID] = useState("");

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showTeacherID, setShowTeacherID] = useState(false);

  // Collection name for subscription
  const [collectionName, setCollectionName] = useState("");

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isLogin]);

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

      // Store user in context
      setUser(response.user);

      // Connect to socket and subscribe to benches and reservations collections
      const collections = ["benches", "messages"];
      setupSocketConnection(response.user._id, collections, (message) => {
        console.log("Received message from socket:", message);
      });

      // Navigate to Benches screen
      goToScreen("Benches");
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
        teacherID: teacherID.trim() || undefined,
      };
      const response = await register(registerData);

      // Store user in context
      setUser(response.user);

      setIsLogin(true);
      // Clear teacherID field
      setTeacherID("");
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        <ScrollView
          contentContainerStyle={tw`flex-grow justify-center px-4 py-8`}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              tw`w-full max-w-md mx-auto`,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Main Card */}
            <View style={[styles.card, tw`shadow-lg`]}>
              {/* Toggle Tabs */}
              <View style={tw`flex-row mb-6 bg-gray-100 rounded-xl p-1`}>
                <TouchableOpacity
                  style={tw`flex-1 py-3 px-4 rounded-lg ${
                    isLogin ? "bg-blue-500 shadow-md" : ""
                  }`}
                  onPress={() => {
                    setIsLogin(true);
                    setError("");
                  }}
                >
                  <Text
                    style={tw`text-center font-semibold text-base ${
                      isLogin ? "text-white" : "text-gray-600"
                    }`}
                  >
                    Login
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`flex-1 py-3 px-4 rounded-lg ${
                    !isLogin ? "bg-blue-500 shadow-md" : ""
                  }`}
                  onPress={() => {
                    setIsLogin(false);
                    setError("");
                  }}
                >
                  <Text
                    style={tw`text-center font-semibold text-base ${
                      !isLogin ? "text-white" : "text-gray-600"
                    }`}
                  >
                    Register
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error ? (
                <View
                  style={tw`bg-red-100 border-2 border-red-400 rounded-xl p-4 mb-4 flex-row items-center shadow-sm`}
                >
                  <Ionicons name="alert-circle" size={20} color="#dc2626" />
                  <Text style={tw`text-red-700 ml-2 flex-1 font-medium`}>
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Register Fields */}
              {!isLogin && (
                <Animated.View
                  style={{
                    opacity: fadeAnim,
                  }}
                >
                  <InputField
                    icon={{ type: Ionicons, name: "person-outline" }}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                  <InputField
                    icon={{
                      type: MaterialCommunityIcons,
                      name: "school-outline",
                    }}
                    placeholder="University Name"
                    value={universityName}
                    onChangeText={setUniversityName}
                    autoCapitalize="words"
                  />
                  <InputField
                    icon={{
                      type: MaterialCommunityIcons,
                      name: "calendar-account-outline",
                    }}
                    placeholder="University Year"
                    value={universityYear}
                    onChangeText={setUniversityYear}
                    keyboardType="numeric"
                  />
                  <InputField
                    icon={{ type: Ionicons, name: "call-outline" }}
                    placeholder="Phone Number"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                  <InputField
                    icon={{
                      type: MaterialCommunityIcons,
                      name: "account-key-outline",
                    }}
                    placeholder="Teacher ID (optional, for admin)"
                    value={teacherID}
                    onChangeText={setTeacherID}
                    autoCapitalize="none"
                    secureTextEntry={showTeacherID}
                    showPasswordToggle={true}
                    onTogglePassword={() => setShowTeacherID(!showTeacherID)}
                  />
                </Animated.View>
              )}

              {/* Common Fields */}
              <InputField
                icon={{ type: Ionicons, name: "mail-outline" }}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <InputField
                icon={{ type: Ionicons, name: "lock-closed-outline" }}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                showPasswordToggle={true}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={tw`bg-blue-500 rounded-xl py-4 items-center justify-center mt-2 shadow-lg ${
                  loading ? "opacity-70" : ""
                }`}
                onPress={isLogin ? handleLogin : handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <View style={tw`flex-row items-center`}>
                    <Text style={tw`text-white font-bold text-lg mr-2`}>
                      {isLogin ? "Sign In" : "Create Account"}
                    </Text>
                    <Ionicons
                      name={isLogin ? "arrow-forward" : "person-add"}
                      size={20}
                      color="white"
                    />
                  </View>
                )}
              </TouchableOpacity>

              {/* Footer Text */}
              <View style={tw`mt-6 items-center`}>
                <Text style={tw`text-gray-600 text-sm text-center`}>
                  {isLogin
                    ? "Don't have an account? "
                    : "Already have an account? "}
                  <Text
                    style={tw`text-blue-600 font-semibold`}
                    onPress={() => {
                      setIsLogin(!isLogin);
                      setError("");
                    }}
                  >
                    {isLogin ? "Register" : "Login"}
                  </Text>
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
});
