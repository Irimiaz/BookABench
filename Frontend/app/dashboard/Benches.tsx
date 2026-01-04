import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import BaseScreen from "../../components/BaseScreen";
import useStackNavigation from "../../hooks/useStackNavigation";
import { MainStackParamList } from "../../types/navigation";
import {
  getData,
  setData,
  modifyData,
  deleteData,
  onDatabaseChange,
  type DatabaseChangeMessage,
} from "../../utils/exportHelpers";
import { useAuth } from "../../contexts/AuthContext";
import tw from "twrnc";

type Bench = {
  _id: string;
  name: string;
  location: string;
  description?: string;
  capacity?: number;
  isAvailable?: boolean;
  [key: string]: any;
};

type Reservation = {
  _id: string;
  userId: string;
  benchId: string;
  status?: "active" | "cancelled" | "completed";
  date: string;
  startTime: string;
  endTime: string;
  userName?: string;
  userEmail?: string;
  [key: string]: any;
};

// Web-native input component for date
const WebInput = ({ type, value, onChangeText, min, ...props }: any) => {
  if (Platform.OS !== "web") return null;
  
  return React.createElement("input", {
    type,
    value: value || "",
    onChange: (e: any) => onChangeText(e.target.value),
    style: {
      width: "100%",
      backgroundColor: "#f9fafb",
      border: "1px solid #d1d5db",
      borderRadius: "0.5rem",
      padding: "12px 16px",
      fontSize: "16px",
      fontFamily: "inherit",
      outline: "none",
      boxSizing: "border-box",
      lineHeight: "1.5",
    },
    min,
    ...props,
  } as any);
};

export default function Benches() {
  const { goBack, goToScreen } = useStackNavigation<MainStackParamList>();
  const { isAdmin, user } = useAuth();
  const [benches, setBenches] = useState<Bench[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form fields
  const [benchName, setBenchName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Date picker for viewing availability
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch all benches and reservations
  const fetchBenches = async () => {
    setFetching(true);
    setError("");
    try {
      const benchesData = await getData<Bench>("benches", {});
      setBenches(benchesData || []);

      // Fetch active reservations
      const reservationsData = await getData<Reservation>("reservations", {
        status: "active",
      });

      // Fetch user information for each reservation (for all users)
      // Get unique user IDs
      const userIds = [...new Set(reservationsData.map((res) => res.userId))];
      // Fetch user data for all unique user IDs
      const usersData = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const users = await getData<any>("users", { _id: userId });
            return users.length > 0 ? users[0] : null;
          } catch {
            return null;
          }
        })
      );
      
      // Create a map of userId to user data
      const userMap = new Map();
      userIds.forEach((userId, index) => {
        if (usersData[index]) {
          userMap.set(userId, usersData[index]);
        }
      });
      
      // Enrich reservations with user information
      const enriched = reservationsData.map((res) => {
        const userData = userMap.get(res.userId);
        return {
          ...res,
          userName: userData?.name || "Unknown User",
          userEmail: userData?.email || "",
        };
      });
      
      setReservations(enriched || []);
    } catch (error: any) {
      setError(error.message || "Failed to fetch benches");
    } finally {
      setFetching(false);
    }
  };

  // Fetch benches on mount
  useEffect(() => {
    fetchBenches();
  }, []);

  // Refresh benches when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBenches();
    }, [])
  );

  // Listen for real-time database changes via socket
  useEffect(() => {
    if (!user?._id) return;

    const cleanup = onDatabaseChange((message: DatabaseChangeMessage) => {
      // Refresh benches if benches collection changed
      if (message.collection === "benches") {
        fetchBenches();
      }
      // Refresh benches if reservations changed (affects availability)
      if (message.collection === "reservations") {
        fetchBenches();
      }
    });

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // Create or Update bench
  const handleSave = async () => {
    if (!benchName || !location) {
      setError("Please fill in name and location");
      return;
    }

    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      if (editingId) {
        // Update existing bench - don't override isAvailable, let it be determined by reservations
        await modifyData(
          "benches",
          { _id: editingId },
          {
            name: benchName.trim(),
            location: location.trim(),
            description: description.trim() || undefined,
            capacity: capacity ? parseInt(capacity) : undefined,
          }
        );
        setSuccessMessage("Bench updated successfully");
      } else {
        // Create new bench
        await setData("benches", {
          name: benchName.trim(),
          location: location.trim(),
          description: description.trim() || undefined,
          capacity: capacity ? parseInt(capacity) : undefined,
          isAvailable: true,
        });
        setSuccessMessage("Bench created successfully");
      }

      // Reset form and refresh list
      setBenchName("");
      setLocation("");
      setDescription("");
      setCapacity("");
      setEditingId(null);
      setShowForm(false);
      await fetchBenches();
    } catch (error: any) {
      setError(error.message || "Failed to save bench");
    } finally {
      setLoading(false);
    }
  };

  // Delete bench
  const handleDelete = async (id: string) => {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      await deleteData("benches", { _id: id });
      setSuccessMessage("Bench deleted successfully");
      await fetchBenches();
    } catch (error: any) {
      setError(error.message || "Failed to delete bench");
    } finally {
      setLoading(false);
    }
  };

  // Edit bench
  const handleEdit = (bench: Bench) => {
    setBenchName(bench.name);
    setLocation(bench.location);
    setDescription(bench.description || "");
    setCapacity(bench.capacity?.toString() || "");
    setEditingId(bench._id);
    setShowForm(true);
    setError("");
    setSuccessMessage("");
  };

  const handleCancelEdit = () => {
    setBenchName("");
    setLocation("");
    setDescription("");
    setCapacity("");
    setEditingId(null);
    setShowForm(false);
    setError("");
    setSuccessMessage("");
  };

  const handleNewBench = () => {
    handleCancelEdit();
    setShowForm(true);
  };

  // Format date to YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Get bench reservations for a specific date
  const getBenchReservationsForDate = (benchId: string, date: string) => {
    return reservations
      .filter(
        (r) =>
          r.benchId === benchId &&
          r.date === date
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Handle date picker change
  const onDateChange = (event: any, newDate?: Date) => {
    const currentDate = newDate || selectedDate;
    setShowDatePicker(Platform.OS === "ios");
    if (event.type === "set" && currentDate) {
      setSelectedDate(currentDate);
    }
  };

  // Calculate stats
  const totalBenches = benches.length;
  const availableBenches = benches.filter((b) => b.isAvailable).length;
  const totalCapacity = benches.reduce((sum, b) => sum + (b.capacity || 0), 0);

  return (
    <BaseScreen
      title="Study Benches"
      subtitle="Find your perfect study spot on campus"
      onBack={goBack}
    >
      <ScrollView 
        style={tw`flex-1 bg-white`} 
        contentContainerStyle={tw`pb-8 px-5`}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Action Buttons */}
        {!showForm && (
          <View style={tw`mb-8`}>
            <View style={tw`flex-row gap-4`}>
              <TouchableOpacity
                style={tw`bg-emerald-600 px-6 py-4 rounded-2xl flex-1 border border-emerald-700 active:opacity-90`}
                onPress={() => goToScreen("Reservations")}
              >
                <Text style={tw`text-white font-semibold text-center text-base tracking-wide`}>My Bookings</Text>
              </TouchableOpacity>
              {isAdmin && (
                <TouchableOpacity
                  style={tw`bg-blue-700 px-6 py-4 rounded-2xl flex-1 flex-row items-center justify-center gap-2 border border-blue-800 active:opacity-90`}
                  onPress={handleNewBench}
                >
                  <Text style={tw`text-white font-bold text-xl`}>+</Text>
                  <Text style={tw`text-white font-semibold text-base tracking-wide`}>Add Bench</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Messages */}
        {error ? (
          <View
            style={tw`bg-red-50 border-l-4 border-red-400 rounded-xl p-4 mb-6 flex-row items-center justify-between`}
          >
            <View style={tw`flex-row items-center gap-3 flex-1`}>
              <Text style={tw`text-red-500 text-xl`}>⚠️</Text>
              <Text style={tw`text-red-800 flex-1 font-medium text-base`}>{error}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setError("")}
              style={tw`p-1.5 rounded-full active:bg-red-100`}
            >
              <Text style={tw`text-red-700 font-bold text-xl`}>×</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {successMessage ? (
          <View
            style={tw`bg-emerald-50 border-l-4 border-emerald-500 rounded-xl p-4 mb-6 flex-row items-center justify-between`}
          >
            <View style={tw`flex-row items-center gap-3 flex-1`}>
              <Text style={tw`text-emerald-600 text-xl`}>✨</Text>
              <Text style={tw`text-emerald-900 font-medium text-base`}>{successMessage}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setSuccessMessage("")}
              style={tw`p-1.5 rounded-full active:bg-emerald-100`}
            >
              <Text style={tw`text-emerald-800 font-bold text-xl`}>×</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Form Section (only for admin) */}
        {showForm && isAdmin && (
          <View style={tw`bg-white rounded-3xl p-8 mb-8 border border-gray-300 shadow-sm`}>
            <View style={tw`flex-row justify-between items-start mb-8`}>
              <View style={tw`flex-1`}>
                <Text style={tw`text-4xl font-bold mb-3 text-gray-900 tracking-tight`}>
                  {editingId ? "Edit Bench" : "Add New Bench"}
                </Text>
                <Text style={tw`text-gray-600 text-lg`}>
                  {editingId
                    ? "Update bench information"
                    : "Create a new study space"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCancelEdit}
                style={tw`p-3 rounded-2xl bg-gray-100 active:bg-gray-200`}
              >
                <Text style={tw`text-gray-600 font-bold text-xl`}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={tw`mb-5`}>
              <Text style={tw`text-lg font-semibold mb-3 text-gray-900`}>
                Bench Name *
              </Text>
              <TextInput
                style={tw`w-full bg-gray-50 border border-gray-300 rounded-2xl px-5 py-4 text-base`}
                placeholder="e.g., Library Terrace"
                value={benchName}
                onChangeText={setBenchName}
              />
            </View>

            <View style={tw`mb-5`}>
              <Text style={tw`text-lg font-semibold mb-3 text-gray-900`}>
                Location *
              </Text>
              <TextInput
                style={tw`w-full bg-gray-50 border border-gray-300 rounded-2xl px-5 py-4 text-base`}
                placeholder="e.g., Main Library, 3rd Floor"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={tw`mb-5`}>
              <Text style={tw`text-lg font-semibold mb-3 text-gray-900`}>
                Description
              </Text>
              <TextInput
                style={tw`w-full bg-gray-50 border border-gray-300 rounded-2xl px-5 py-4 text-base`}
                placeholder="Describe the study space..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={tw`mb-6`}>
              <Text style={tw`text-lg font-semibold mb-3 text-gray-900`}>
                Capacity
              </Text>
              <TextInput
                style={tw`w-full bg-gray-50 border border-gray-300 rounded-2xl px-5 py-4 text-base max-w-xs`}
                placeholder="e.g., 4"
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="numeric"
              />
            </View>

            <View style={tw`flex-row gap-4 pt-4 border-t border-gray-200`}>
              <TouchableOpacity
                style={tw`flex-1 bg-blue-700 px-6 py-4 rounded-2xl items-center justify-center flex-row gap-2 border border-blue-800 active:opacity-90`}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={tw`text-white font-semibold text-base tracking-wide`}>
                      {editingId ? "Update Bench" : "Create Bench"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`flex-1 bg-gray-100 px-6 py-4 rounded-2xl items-center justify-center border border-gray-400 active:bg-gray-200`}
                onPress={handleCancelEdit}
                disabled={loading}
              >
                <Text style={tw`text-gray-700 font-semibold text-base tracking-wide`}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Date Picker for Availability */}
        {!showForm && (
          <View style={tw`mb-6`}>
            <Text style={tw`text-base font-semibold mb-3 text-gray-900`}>
              View Availability for Date
            </Text>
            {Platform.OS === "web" ? (
              <WebInput
                type="date"
                value={formatDateString(selectedDate)}
                onChangeText={(value: string) => {
                  if (value) {
                    const [year, month, day] = value.split("-").map(Number);
                    setSelectedDate(new Date(year, month - 1, day));
                  }
                }}
                min={formatDateString(new Date())}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={tw`w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between`}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={tw`text-gray-900 text-sm font-medium`}>
                    {formatDateString(selectedDate)}
                  </Text>
                  <Text style={tw`text-gray-500 text-lg`}>📅</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </>
            )}
          </View>
        )}

        {/* Stats Bar */}
        <View style={tw`flex-row gap-5 mb-8`}>
          <View style={tw`flex-1 bg-white rounded-3xl p-6 border border-gray-300 shadow-sm`}>
            <View style={tw`flex-row items-center gap-4`}>
              <View style={tw`p-3 rounded-2xl bg-blue-50`}>
                <Text style={tw`text-blue-600 text-lg`}>📍</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-4xl font-bold text-gray-900 mb-1`}>{totalBenches}</Text>
                <Text style={tw`text-sm text-gray-600 font-semibold`}>Total Spaces</Text>
              </View>
            </View>
          </View>

          <View style={tw`flex-1 bg-white rounded-3xl p-6 border border-gray-300 shadow-sm`}>
            <View style={tw`flex-row items-center gap-4`}>
              <View style={tw`p-3 rounded-2xl bg-emerald-50`}>
                <Text style={tw`text-emerald-600 text-lg`}>✨</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-4xl font-bold text-gray-900 mb-1`}>{availableBenches}</Text>
                <Text style={tw`text-sm text-gray-600 font-semibold`}>Available Now</Text>
              </View>
            </View>
          </View>

          <View style={tw`flex-1 bg-white rounded-3xl p-6 border border-gray-300 shadow-sm`}>
            <View style={tw`flex-row items-center gap-4`}>
              <View style={tw`p-3 rounded-2xl bg-amber-50`}>
                <Text style={tw`text-amber-600 text-lg`}>👥</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-4xl font-bold text-gray-900 mb-1`}>{totalCapacity}</Text>
                <Text style={tw`text-sm text-gray-600 font-semibold`}>Total Capacity</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Benches Grid Section */}
        <View style={tw`mb-6`}>
          <View style={tw`flex-row justify-between items-center mb-6`}>
            <Text style={tw`text-4xl font-bold text-gray-900 tracking-tight`}>
              Available Study Spaces
            </Text>
            <View style={tw`bg-white border border-gray-300 px-5 py-2 rounded-full`}>
              <Text style={tw`text-sm text-gray-700 font-semibold`}>
                {benches.length} {benches.length === 1 ? "space" : "spaces"}
              </Text>
            </View>
          </View>

          {benches.length === 0 ? (
            <View style={tw`bg-white rounded-3xl p-16 items-center border border-gray-300 shadow-sm`}>
              <Text style={tw`text-7xl mb-6`}>📍</Text>
              <Text style={tw`text-2xl font-bold mb-3 text-gray-900`}>No benches yet</Text>
              <Text style={tw`text-gray-600 text-center mb-8 text-lg`}>
                {isAdmin
                  ? "Create your first study space to get started."
                  : "Check back later for available spaces."}
              </Text>
              {isAdmin && (
                <TouchableOpacity
                  style={tw`bg-blue-700 px-6 py-4 rounded-2xl flex-row items-center gap-2 border border-blue-800 active:opacity-90`}
                  onPress={handleNewBench}
                >
                  <Text style={tw`text-white font-bold text-xl`}>+</Text>
                  <Text style={tw`text-white font-semibold text-base tracking-wide`}>
                    Add First Bench
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={tw`gap-5`}>
              {benches.map((item) => (
                <View
                  key={item._id}
                  style={tw`bg-white rounded-3xl p-7 border border-gray-300 shadow-sm`}
                >
                  <View style={tw`flex-row justify-between items-start mb-4`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-3xl font-bold mb-3 text-gray-900 tracking-tight`}>
                        {item.name}
                      </Text>
                      <View style={tw`flex-row items-center gap-2.5 mb-2`}>
                        <Text style={tw`text-gray-500 text-base`}>📍</Text>
                        <Text style={tw`text-base text-gray-700 font-medium`}>
                          {item.location}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {item.description && (
                    <Text style={tw`text-base text-gray-600 mb-4 leading-6`}>
                      {item.description}
                    </Text>
                  )}

                  {item.capacity && (
                    <View style={tw`flex-row items-center gap-2.5 mb-4`}>
                      <Text style={tw`text-blue-600 text-base`}>👥</Text>
                      <Text style={tw`text-base font-semibold text-gray-800`}>
                        Capacity: {item.capacity} people
                      </Text>
                    </View>
                  )}

                  {/* Availability for selected date */}
                  {(() => {
                    const dateStr = formatDateString(selectedDate);
                    const benchReservations = getBenchReservationsForDate(item._id, dateStr);
                    return benchReservations.length > 0 ? (
                      <View style={tw`mb-4`}>
                        {benchReservations.map((r) => (
                          <View key={r._id} style={tw`mt-3`}>
                            <Text style={tw`text-red-700 text-base font-semibold`}>
                              🔴 Ocupată {r.startTime} – {r.endTime}
                            </Text>
                            {r.userName && (
                              <View style={tw`flex-row items-center gap-2 mt-1.5 ml-1`}>
                                <Text style={tw`text-gray-600 text-sm`}>👤</Text>
                                <Text style={tw`text-sm text-gray-800 font-medium`}>
                                  {r.userName}
                                  {isAdmin && r.userEmail && (
                                    <Text style={tw`text-gray-600`}> ({r.userEmail})</Text>
                                  )}
                                </Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={tw`text-emerald-700 text-base font-semibold mt-1 mb-4`}>
                        🟢 Liberă azi
                      </Text>
                    );
                  })()}

                  {/* Action buttons */}
                  {isAdmin ? (
                    <View style={tw`flex-row gap-3 pt-2`}>
                      <TouchableOpacity
                        style={tw`flex-1 bg-blue-600 px-5 py-3.5 rounded-xl flex-row items-center justify-center gap-2 border border-blue-700 active:opacity-90`}
                        onPress={() => handleEdit(item)}
                      >
                        <Text style={tw`text-white font-semibold text-base`}>✏️</Text>
                        <Text style={tw`text-white font-semibold text-base`}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={tw`flex-1 bg-red-600 px-5 py-3.5 rounded-xl flex-row items-center justify-center gap-2 border border-red-700 active:opacity-90`}
                        onPress={() => handleDelete(item._id)}
                      >
                        <Text style={tw`text-white font-semibold text-base`}>🗑️</Text>
                        <Text style={tw`text-white font-semibold text-base`}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={tw`w-full bg-blue-700 px-5 py-3.5 rounded-xl flex-row items-center justify-center gap-2 border border-blue-800 active:opacity-90`}
                      onPress={() => goToScreen("Reservations")}
                    >
                      <Text style={tw`text-white text-base`}>📅</Text>
                      <Text style={tw`text-white font-semibold text-base tracking-wide`}>
                        Reserve Now
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </BaseScreen>
  );
}
