import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Platform,
  Alert,
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
};

type Reservation = {
  _id: string;
  userId: string;
  benchId: string;
  benchName?: string;
  location?: string;
  date: string;
  startTime: string;
  endTime: string;
  status?: "active" | "cancelled" | "completed";
  createdAt?: string;
  userName?: string;
  userEmail?: string;
  [key: string]: any;
};

// Web-native input component for date/time
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

export default function Reservations() {
  const { goBack, goToScreen } = useStackNavigation<MainStackParamList>();
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]); // All active reservations for availability display
  const [benches, setBenches] = useState<Bench[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form fields
  const [selectedBenchId, setSelectedBenchId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState(new Date());
  const [selectedEndTime, setSelectedEndTime] = useState(new Date());

  // Fetch benches
  const fetchBenches = async () => {
    try {
      const data = await getData<Bench>("benches", {});
      setBenches(data || []);
    } catch (error: any) {
      console.error("Failed to fetch benches:", error);
    }
  };

  // Fetch all active reservations for availability display
  const fetchAllReservations = async () => {
    try {
      const allReservationsData = await getData<Reservation>("reservations", {
        status: "active",
      });
      setAllReservations(allReservationsData || []);
    } catch (error: any) {
      console.error("Failed to fetch all reservations:", error);
    }
  };

  // Fetch reservations (filter by userId if not admin)
  const fetchReservations = async () => {
    setFetching(true);
    setError("");
    try {
      const query = user?.role === "admin" ? {} : user?._id ? { userId: user._id } : {};
      const data = await getData<Reservation>("reservations", query);
      
      // If admin, fetch user information for each reservation
      let enriched = data;
      if (user?.role === "admin") {
        // Get unique user IDs
        const userIds = [...new Set(data.map((res) => res.userId))];
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
        
        // Enrich reservations with user and bench information
        enriched = data.map((res) => {
          const bench = benches.find((b) => b._id === res.benchId);
          const userData = userMap.get(res.userId);
          return {
            ...res,
            benchName: bench?.name || "Unknown Bench",
            location: bench?.location || "Unknown Location",
            userName: userData?.name || "Unknown User",
            userEmail: userData?.email || "",
          };
        });
      } else {
        // Enrich with bench information only for non-admin users
        enriched = data.map((res) => {
          const bench = benches.find((b) => b._id === res.benchId);
          return {
            ...res,
            benchName: bench?.name || "Unknown Bench",
            location: bench?.location || "Unknown Location",
          };
        });
      }
      
      setReservations(enriched || []);
    } catch (error: any) {
      setError(error.message || "Failed to fetch reservations");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchBenches();
  }, []);

  useEffect(() => {
    if (benches.length > 0 && user?._id) {
      fetchReservations();
      fetchAllReservations();
    }
  }, [benches, user?._id]);

  // Refresh reservations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (benches.length > 0 && user?._id) {
        fetchReservations();
        fetchAllReservations();
      }
    }, [benches.length, user?._id])
  );

  // Listen for real-time database changes via socket
  useEffect(() => {
    if (!user?._id) return;

    const cleanup = onDatabaseChange((message: DatabaseChangeMessage) => {
      // Handle reservations changes
      if (message.collection === "reservations") {
        const reservationData = message.data;
        
        // Check if a reservation was deleted
        if (message.operation === "DELETE_DATA") {
          // Check if this was one of the user's reservations
          const wasMyReservation = reservations.some(
            (res) => res._id === message.documentId
          );
          if (wasMyReservation) {
            const day = formatDate(reservationData.date);
            const timeRange = `${reservationData.startTime} - ${reservationData.endTime}`;
            const benchName = benches.find(
              (b) => b._id === reservationData.benchId
            )?.name || "banc";
            
            Alert.alert(
              "Sala ocupată",
              `${benchName} a fost rezervată pe ${day}, între orele ${timeRange}.`,
              [{ text: "OK" }]
            );
          }
        }
        
        // Check if a new reservation was created by someone else
        if (message.operation === "SET_DATA" && reservationData) {
          const isNewReservation = !reservations.some(
            (res) => res._id === message.documentId
          );
          const isNotMine = reservationData.userId !== user._id;
          
          if (isNewReservation && isNotMine) {
            const benchName = benches.find(
              (b) => b._id === reservationData.benchId
            )?.name || "a bench";
            Alert.alert(
              "New Reservation",
              `Someone else has reserved ${benchName}.`,
              [{ text: "OK" }]
            );
          }
        }
        
        fetchReservations();
        fetchAllReservations();
      }
      
      // Handle benches changes
      if (message.collection === "benches") {
        // Check if a bench that the user has reserved was deleted
        if (message.operation === "DELETE_DATA") {
          const hasReservationForDeletedBench = reservations.some(
            (res) => res.benchId === message.documentId && res.status === "active"
          );
          if (hasReservationForDeletedBench) {
            const deletedBench = benches.find((b) => b._id === message.documentId);
            Alert.alert(
              "Bench Deleted",
              `The bench "${deletedBench?.name || "you reserved"}" has been deleted. Your reservation may no longer be valid.`,
              [{ text: "OK" }]
            );
          }
        }
        
        fetchBenches();
        // Also refresh reservations after benches are updated to update bench info
        setTimeout(() => {
          fetchReservations();
          fetchAllReservations();
        }, 200);
      }
    });

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, reservations, benches]);

  // Create or Update reservation
  const handleSave = async () => {
    if (!selectedBenchId || !date || !startTime || !endTime) {
      setError("Please fill in all fields");
      return;
    }

    if (!user?._id) {
      setError("User ID is required. Please login again.");
      return;
    }

    // Validate time
    if (startTime >= endTime) {
      setError("End time must be after start time");
      return;
    }

    // For non-admin users, check for overlapping reservations
    if (user?.role !== "admin") {
      try {
        const existingReservations = await getData<Reservation>("reservations", {
          benchId: selectedBenchId,
          date: date.trim(),
          status: "active",
        });

        // Find the overlapping reservation (excluding the one being edited)
        const overlappingReservation = existingReservations.find((res) => {
          // Skip the reservation being edited
          if (editingId && res._id === editingId) {
            return false;
          }
          
          // Check if time ranges overlap
          // Two time ranges overlap if: startTime < existing.endTime && endTime > existing.startTime
          const resStart = res.startTime.trim();
          const resEnd = res.endTime.trim();
          const newStart = startTime.trim();
          const newEnd = endTime.trim();
          
          // Check if times overlap (not just exact match)
          // Overlap occurs when: newStart < resEnd && newEnd > resStart
          const overlaps = newStart < resEnd && newEnd > resStart;
          
          return overlaps;
        });

        if (overlappingReservation) {
          const day = formatDate(overlappingReservation.date);
          const start = overlappingReservation.startTime;
          const end = overlappingReservation.endTime;
        
          setError(
            `Sala este deja ocupată în data de ${day}, între orele ${start} – ${end}. Te rugăm să alegi alt interval.`
          );
          return;
        }
      } catch (error: any) {
        console.error("Failed to check for overlapping reservations:", error);
        // Continue with reservation creation even if check fails
      }
    }

    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      if (editingId) {
        // Update existing reservation
        await modifyData(
          "reservations",
          { _id: editingId },
          {
            benchId: selectedBenchId,
            date: date.trim(),
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            status: "active",
          }
        );
        setSuccessMessage("Reservation updated successfully");
      } else {
        // Create new reservation
        await setData("reservations", {
          userId: user._id,
          benchId: selectedBenchId,
          date: date.trim(),
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          status: "active",
        });
        setSuccessMessage("Reservation created successfully");
      }

      // Reset form and refresh list
      setSelectedBenchId("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setEditingId(null);
      setShowForm(false);
      await fetchReservations();
      await fetchAllReservations();
    } catch (error: any) {
      setError(error.message || "Failed to save reservation");
    } finally {
      setLoading(false);
    }
  };

  // Cancel reservation
  const handleCancel = async (id: string) => {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      await modifyData(
        "reservations",
        { _id: id },
        { status: "cancelled" }
      );
      setSuccessMessage("Reservation cancelled successfully");
      await fetchReservations();
      await fetchAllReservations();
    } catch (error: any) {
      setError(error.message || "Failed to cancel reservation");
    } finally {
      setLoading(false);
    }
  };

  // Delete reservation
  const handleDelete = async (id: string) => {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      await deleteData("reservations", { _id: id });
      setSuccessMessage("Reservation deleted successfully");
      await fetchReservations();
      await fetchAllReservations();
    } catch (error: any) {
      setError(error.message || "Failed to delete reservation");
    } finally {
      setLoading(false);
    }
  };

  // Format date to YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Format time to HH:MM
  const formatTimeString = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Parse date string to Date object
  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  // Parse time string and combine with date
  const parseTime = (timeStr: string, baseDate: Date): Date => {
    if (!timeStr) return new Date();
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Handle date picker change
  const onDateChange = (event: any, newDate?: Date) => {
    const currentDate = newDate || selectedDate;
    setShowDatePicker(Platform.OS === "ios");
    if (event.type === "set" && currentDate) {
      setSelectedDate(currentDate);
      setDate(formatDateString(currentDate));
    }
  };

  // Handle start time picker change
  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || selectedStartTime;
    setShowStartTimePicker(Platform.OS === "ios");

    if (event.type === "set" && currentTime) {
      const formatted = formatTimeString(currentTime);

      if (isStartTimeBlocked(formatted)) {
        setError("Ora de început este deja ocupată.");
        return;
      }

      setError("");
      setSelectedStartTime(currentTime);
      setStartTime(formatted);
    }
  };

  // Handle end time picker change
  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || selectedEndTime;
    setShowEndTimePicker(Platform.OS === "ios");

    if (event.type === "set" && currentTime) {
      const formatted = formatTimeString(currentTime);

      if (isEndTimeBlocked(formatted)) {
        setError("Intervalul selectat se suprapune cu o rezervare existentă.");
        return;
      }

      setError("");
      setSelectedEndTime(currentTime);
      setEndTime(formatted);
    }
  };

  // Edit reservation
  const handleEdit = (reservation: Reservation) => {
    setSelectedBenchId(reservation.benchId);
    setDate(reservation.date);
    setStartTime(reservation.startTime);
    setEndTime(reservation.endTime);
    
    // Set date/time picker values
    const parsedDate = parseDate(reservation.date);
    setSelectedDate(parsedDate);
    setSelectedStartTime(parseTime(reservation.startTime, parsedDate));
    setSelectedEndTime(parseTime(reservation.endTime, parsedDate));
    
    setEditingId(reservation._id);
    setShowForm(true);
    setError("");
    setSuccessMessage("");
  };

  const handleCancelEdit = () => {
    setSelectedBenchId("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setEditingId(null);
    setShowForm(false);
    setError("");
    setSuccessMessage("");
    setShowDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
    const now = new Date();
    setSelectedDate(now);
    setSelectedStartTime(now);
    setSelectedEndTime(now);
  };

  const handleNewReservation = () => {
    if (!user?._id) {
      setError("Please login to create reservations");
      return;
    }
    handleCancelEdit();
    setShowForm(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500";
      case "cancelled":
        return "bg-red-500";
      case "completed":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusTextColor = (status?: string) => {
    switch (status) {
      case "active":
        return "text-blue-700";
      case "cancelled":
        return "text-red-700";
      case "completed":
        return "text-gray-700";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "cancelled":
        return "Cancelled";
      case "completed":
        return "Completed";
      default:
        return "Pending";
    }
  };

  // Helper function to get bench occupancy for a specific date
  const getBenchOccupancyForDate = (benchId: string, date: string) => {
    return allReservations
      .filter(
        (r) =>
          r.benchId === benchId &&
          r.date === date &&
          r.status === "active"
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Get disabled time ranges for selected bench and date
  const getDisabledTimeRanges = () => {
    if (!selectedBenchId || !date) return [];

    return allReservations.filter(
      (r) =>
        r.benchId === selectedBenchId &&
        r.date === date &&
        r.status === "active" &&
        (!editingId || r._id !== editingId)
    );
  };

  // Check if start time is blocked
  const isStartTimeBlocked = (time: string) => {
    return getDisabledTimeRanges().some(
      (r) => time >= r.startTime && time < r.endTime
    );
  };

  // Check if end time is blocked
  const isEndTimeBlocked = (time: string) => {
    return getDisabledTimeRanges().some(
      (r) => time > r.startTime && time <= r.endTime
    );
  };

  // Calculate stats
  const activeReservations = reservations.filter((r) => r.status === "active");
  const upcomingReservations = reservations.filter(
    (r) => r.status === "active" && new Date(r.date) >= new Date()
  );

  return (
    <BaseScreen
      title="My Reservations"
      subtitle={user?.role === "admin" ? "Manage all reservations" : "Manage your bench reservations"}
      onBack={goBack}
    >
      <ScrollView style={tw`flex-1 bg-gray-50`} contentContainerStyle={tw`pb-8 px-5`}>
        {/* Messages */}
        {error ? (
          <View
            style={tw`bg-red-50 border-l-4 border-red-400 rounded-xl p-4 mb-6 flex-row items-center justify-between shadow-sm`}
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
            style={tw`bg-emerald-50 border-l-4 border-emerald-500 rounded-xl p-4 mb-6 flex-row items-center justify-between shadow-sm`}
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

        {/* Action Buttons */}
        {!showForm && (
          <View style={tw`mb-8`}>
            <View style={tw`flex-row gap-4`}>
              <TouchableOpacity
                style={tw`bg-emerald-600 px-6 py-4 rounded-2xl flex-1 shadow-lg active:opacity-90`}
                onPress={() => goToScreen("Benches")}
              >
                <Text style={tw`text-white font-semibold text-center text-base tracking-wide`}>View Benches</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`bg-blue-700 px-6 py-4 rounded-2xl flex-1 flex-row items-center justify-center gap-2 shadow-lg active:opacity-90`}
                onPress={handleNewReservation}
              >
                <Text style={tw`text-white font-bold text-xl`}>+</Text>
                <Text style={tw`text-white font-semibold text-base tracking-wide`}>New Reservation</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Form Section */}
        {showForm && (
          <View style={tw`bg-white rounded-3xl p-6 mb-8 border border-gray-200`}>
            {/* Header */}
            <View style={tw`flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200`}>
              <View>
                <Text style={tw`text-2xl font-bold text-gray-900`}>
                  {editingId ? "Edit Reservation" : "New Reservation"}
                </Text>
                <Text style={tw`text-gray-600 text-sm mt-1`}>
                  {editingId ? "Update your reservation details" : "Select bench and time slot"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCancelEdit}
                style={tw`p-2 rounded-xl bg-gray-100 active:bg-gray-200`}
              >
                <Text style={tw`text-gray-600 font-bold text-lg`}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Bench Selection */}
            <View style={tw`mb-6`}>
              <Text style={tw`text-base font-semibold mb-3 text-gray-900`}>Select Bench *</Text>
              <ScrollView
                style={tw`max-h-80`}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                <View style={tw`flex-row flex-wrap gap-3`}>
                  {benches
                    .filter((bench) => bench.isAvailable)
                    .map((bench) => {
                      const occupiedSlots = date
                        ? getBenchOccupancyForDate(bench._id, date)
                        : [];

                      return (
                        <TouchableOpacity
                          key={bench._id}
                          style={tw`flex-1 min-w-[48%] p-4 rounded-xl border-2 ${
                            selectedBenchId === bench._id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 bg-gray-50 active:border-gray-300"
                          }`}
                          onPress={() => setSelectedBenchId(bench._id)}
                        >
                          <View style={tw`flex-row items-center justify-between mb-2`}>
                            <Text style={tw`font-bold text-base text-gray-900 flex-1`} numberOfLines={1}>
                              {bench.name}
                            </Text>
                            {selectedBenchId === bench._id && (
                              <View style={tw`bg-blue-500 rounded-full w-5 h-5 items-center justify-center ml-2`}>
                                <Text style={tw`text-white text-xs font-bold`}>✓</Text>
                              </View>
                            )}
                          </View>
                          <View style={tw`flex-row items-center gap-2 mb-2`}>
                            <Text style={tw`text-gray-500`}>📍</Text>
                            <Text style={tw`text-xs text-gray-700 flex-1`} numberOfLines={1}>
                              {bench.location}
                            </Text>
                          </View>

                          {date && occupiedSlots.length > 0 ? (
                            <View style={tw`mt-2 pt-2 border-t border-gray-200 gap-1.5`}>
                              {occupiedSlots.slice(0, 2).map((r) => {
                                const isMyReservation = r.userId === user?._id && r._id !== editingId;
                                return (
                                  <View key={r._id} style={tw`flex-row items-center gap-2`}>
                                    <View style={tw`w-2 h-2 rounded-full ${isMyReservation ? "bg-amber-500" : "bg-red-500"}`} />
                                    <Text
                                      style={tw`${isMyReservation ? "text-amber-700" : "text-red-700"} text-xs font-medium`}
                                      numberOfLines={1}
                                    >
                                      {r.startTime}–{r.endTime}
                                    </Text>
                                  </View>
                                );
                              })}
                              {occupiedSlots.length > 2 && (
                                <Text style={tw`text-xs text-gray-500`}>
                                  +{occupiedSlots.length - 2} more
                                </Text>
                              )}
                            </View>
                          ) : date ? (
                            <View style={tw`flex-row items-center gap-2 mt-2 pt-2 border-t border-gray-200`}>
                              <View style={tw`w-2 h-2 rounded-full bg-emerald-500`} />
                              <Text style={tw`text-emerald-700 text-xs font-semibold`}>
                                Available
                              </Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </ScrollView>
            </View>

            {/* Date and Time Section */}
            <View style={tw`mb-6`}>
              <Text style={tw`text-base font-semibold mb-3 text-gray-900`}>Date & Time *</Text>
              
              {/* Date */}
              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-medium mb-2 text-gray-700`}>Date</Text>
                {Platform.OS === "web" ? (
                  <WebInput
                    type="date"
                    value={date}
                    onChangeText={setDate}
                    min={formatDateString(new Date())}
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      style={tw`w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between`}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={tw`text-gray-900 font-medium text-sm ${!date ? "text-gray-400" : ""}`}>
                        {date || "Select Date"}
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

              {/* Time Range - Side by Side */}
              <View style={tw`flex-row gap-3`}>
                {/* Start Time */}
                <View style={tw`flex-1`}>
                  <Text style={tw`text-sm font-medium mb-2 text-gray-700`}>Start Time</Text>
                  {Platform.OS === "web" ? (
                    <WebInput
                      type="time"
                      value={startTime}
                      onChangeText={setStartTime}
                    />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={tw`w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between`}
                        onPress={() => setShowStartTimePicker(true)}
                      >
                        <Text style={tw`text-gray-900 font-medium text-sm ${!startTime ? "text-gray-400" : ""}`}>
                          {startTime || "Start"}
                        </Text>
                        <Text style={tw`text-gray-500 text-base`}>🕐</Text>
                      </TouchableOpacity>
                      {showStartTimePicker && (
                        <DateTimePicker
                          value={selectedStartTime}
                          mode="time"
                          display={Platform.OS === "ios" ? "spinner" : "default"}
                          onChange={onStartTimeChange}
                        />
                      )}
                    </>
                  )}
                </View>

                {/* End Time */}
                <View style={tw`flex-1`}>
                  <Text style={tw`text-sm font-medium mb-2 text-gray-700`}>End Time</Text>
                  {Platform.OS === "web" ? (
                    <WebInput
                      type="time"
                      value={endTime}
                      onChangeText={setEndTime}
                    />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={tw`w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between`}
                        onPress={() => setShowEndTimePicker(true)}
                      >
                        <Text style={tw`text-gray-900 font-medium text-sm ${!endTime ? "text-gray-400" : ""}`}>
                          {endTime || "End"}
                        </Text>
                        <Text style={tw`text-gray-500 text-base`}>🕐</Text>
                      </TouchableOpacity>
                      {showEndTimePicker && (
                        <DateTimePicker
                          value={selectedEndTime}
                          mode="time"
                          display={Platform.OS === "ios" ? "spinner" : "default"}
                          onChange={onEndTimeChange}
                        />
                      )}
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={tw`flex-row gap-3 pt-4 border-t border-gray-200`}>
              <TouchableOpacity
                style={tw`flex-1 bg-blue-500 px-5 py-3.5 rounded-xl items-center justify-center shadow-md ${
                  loading ? "opacity-70" : ""
                }`}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={tw`text-white font-semibold text-base`}>
                    {editingId ? "Update" : "Create"}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`bg-gray-100 px-5 py-3.5 rounded-xl items-center justify-center active:bg-gray-200`}
                onPress={handleCancelEdit}
                disabled={loading}
              >
                <Text style={tw`text-gray-700 font-semibold text-base`}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats Cards */}
        <View style={tw`flex-row gap-5 mb-8`}>
          <View style={tw`flex-1 bg-white rounded-3xl p-6 shadow-lg border border-gray-200`}>
            <View style={tw`flex-row items-center gap-4`}>
              <View style={tw`p-4 rounded-2xl bg-blue-50`}>
                <Text style={tw`text-2xl`}>📅</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-4xl font-bold text-gray-900 mb-1`}>{reservations.length}</Text>
                <Text style={tw`text-sm text-gray-600 font-semibold`}>Total Reservations</Text>
              </View>
            </View>
          </View>

          <View style={tw`flex-1 bg-white rounded-3xl p-6 shadow-lg border border-gray-200`}>
            <View style={tw`flex-row items-center gap-4`}>
              <View style={tw`p-4 rounded-2xl bg-emerald-50`}>
                <Text style={tw`text-2xl`}>✨</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-4xl font-bold text-gray-900 mb-1`}>{activeReservations.length}</Text>
                <Text style={tw`text-sm text-gray-600 font-semibold`}>Active</Text>
              </View>
            </View>
          </View>

          <View style={tw`flex-1 bg-white rounded-3xl p-6 shadow-lg border border-gray-200`}>
            <View style={tw`flex-row items-center gap-4`}>
              <View style={tw`p-4 rounded-2xl bg-amber-50`}>
                <Text style={tw`text-2xl`}>⏰</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-4xl font-bold text-gray-900 mb-1`}>{upcomingReservations.length}</Text>
                <Text style={tw`text-sm text-gray-600 font-semibold`}>Upcoming</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Reservations List */}
        <View style={tw`mb-6`}>
          <View style={tw`flex-row justify-between items-center mb-6`}>
            <Text style={tw`text-4xl font-bold text-gray-900 tracking-tight`}>Your Reservations</Text>
            <View style={tw`px-5 py-2 rounded-full border border-gray-300 bg-white shadow-sm`}>
              <Text style={tw`text-sm text-gray-700 font-semibold`}>
                {reservations.length} {reservations.length === 1 ? "reservation" : "reservations"}
              </Text>
            </View>
          </View>

          {reservations.length === 0 ? (
            <View style={tw`bg-white rounded-3xl p-16 items-center border border-gray-200 shadow-lg`}>
              <Text style={tw`text-7xl mb-6`}>📅</Text>
              <Text style={tw`text-2xl font-bold mb-3 text-gray-900`}>No reservations yet</Text>
              <Text style={tw`text-gray-600 mb-8 text-center text-lg`}>
                Create your first reservation to get started.
              </Text>
              <TouchableOpacity
                style={tw`bg-blue-700 px-6 py-4 rounded-2xl flex-row items-center gap-2 shadow-lg active:opacity-90`}
                onPress={handleNewReservation}
              >
                <Text style={tw`text-white font-bold text-xl`}>+</Text>
                <Text style={tw`text-white font-semibold text-base tracking-wide`}>Create Reservation</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={tw`gap-5`}>
              {reservations.map((reservation) => (
                <View
                  key={reservation._id}
                  style={tw`bg-white rounded-3xl p-7 shadow-lg border border-gray-200`}
                >
                  <View style={tw`flex-row justify-between items-start mb-5`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-3xl font-bold mb-3 text-gray-900 tracking-tight`}>
                        {reservation.benchName}
                      </Text>
                      <View style={tw`flex-row items-center gap-2.5 mb-2`}>
                        <Text style={tw`text-gray-500 text-base`}>📍</Text>
                        <Text style={tw`text-base text-gray-700 font-medium`}>{reservation.location}</Text>
                      </View>
                      {user?.role === "admin" && reservation.userName && (
                        <View style={tw`flex-row items-center gap-2.5 mb-1`}>
                          <Text style={tw`text-gray-500 text-base`}>👤</Text>
                          <Text style={tw`text-base text-gray-800 font-medium`}>
                            {reservation.userName}
                            {reservation.userEmail && (
                              <Text style={tw`text-gray-600`}> ({reservation.userEmail})</Text>
                            )}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View
                      style={tw`px-5 py-2 rounded-full ${getStatusColor(reservation.status)} shadow-sm`}
                    >
                      <Text style={tw`text-xs font-semibold text-white tracking-wide uppercase`}>
                        {getStatusText(reservation.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={tw`flex-row gap-6 mb-6 pb-5 border-b border-gray-200`}>
                    <View style={tw`flex-row items-center gap-3`}>
                      <Text style={tw`text-blue-600 text-lg`}>📅</Text>
                      <Text style={tw`text-base font-semibold text-gray-800`}>
                        {formatDate(reservation.date)}
                      </Text>
                    </View>
                    <View style={tw`flex-row items-center gap-3`}>
                      <Text style={tw`text-blue-600 text-lg`}>⏰</Text>
                      <Text style={tw`text-base font-semibold text-gray-800`}>
                        {reservation.startTime} - {reservation.endTime}
                      </Text>
                    </View>
                  </View>

                  {reservation.status === "active" && (
                    <View style={tw`flex-row gap-3 pt-2`}>
                      <TouchableOpacity
                        style={tw`flex-1 bg-blue-600 px-5 py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-md active:opacity-90`}
                        onPress={() => handleEdit(reservation)}
                      >
                        <Text style={tw`text-white font-semibold text-base`}>✏️</Text>
                        <Text style={tw`text-white font-semibold text-base`}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={tw`flex-1 bg-orange-600 px-5 py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-md active:opacity-90`}
                        onPress={() => handleCancel(reservation._id)}
                      >
                        <Text style={tw`text-white font-semibold text-base`}>✖️</Text>
                        <Text style={tw`text-white font-semibold text-base`}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={tw`flex-1 bg-red-600 px-5 py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-md active:opacity-90`}
                        onPress={() => handleDelete(reservation._id)}
                      >
                        <Text style={tw`text-white font-semibold text-base`}>🗑️</Text>
                        <Text style={tw`text-white font-semibold text-base`}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {reservation.status !== "active" && (
                    <View style={tw`flex-row gap-3 pt-2`}>
                      <TouchableOpacity
                        style={tw`flex-1 bg-red-600 px-5 py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-md active:opacity-90`}
                        onPress={() => handleDelete(reservation._id)}
                      >
                        <Text style={tw`text-white font-semibold text-base`}>🗑️</Text>
                        <Text style={tw`text-white font-semibold text-base`}>Delete</Text>
                      </TouchableOpacity>
                    </View>
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
