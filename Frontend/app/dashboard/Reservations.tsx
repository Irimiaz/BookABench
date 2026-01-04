import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
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
} from "../../utils/exportHelpers";
import { useAuth } from "../../contexts/AuthContext";
import tw from "twrnc";

// ==================== TYPES ====================

type Bench = {
  _id: string;
  name: string;
  location: string;
  description?: string;
  capacity?: number;
  isAvailable?: boolean;
  adminId?: string;
  [key: string]: any;
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

// ==================== COMPONENTS ====================

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

// ==================== MAIN COMPONENT ====================

export default function Reservations() {
  const { goBack, goToScreen } = useStackNavigation<MainStackParamList>();
  const { user } = useAuth();

  // State
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [benches, setBenches] = useState<Bench[]>([]);
  const [loading, setLoading] = useState(false);
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

  // ==================== UTILITY FUNCTIONS ====================

  const formatDateString = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTimeString = (d: Date): string => {
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const parseTime = (timeStr: string, baseDate: Date): Date => {
    if (!timeStr) return new Date();
    const [hours, minutes] = timeStr.split(":").map(Number);
    const d = new Date(baseDate);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // ==================== DATA FETCHING ====================

  const fetchBenches = useCallback(async () => {
    try {
      const data = await getData<Bench>("benches", {});
      setBenches(data || []);
    } catch (e: any) {
      console.error("Failed to fetch benches:", e);
    }
  }, []);

  const fetchAllReservations = useCallback(async () => {
    try {
      const allReservationsData = await getData<Reservation>("reservations", {
        status: "active",
      });

      const userIds = [...new Set(allReservationsData.map((r) => r.userId))];

      const usersData = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const users = await getData<any>("users", { _id: userId });
            return users?.[0] ?? null;
          } catch {
            return null;
          }
        })
      );

      const userMap = new Map<string, any>();
      userIds.forEach((userId, idx) => {
        if (usersData[idx]) userMap.set(userId, usersData[idx]);
      });

      const enriched = allReservationsData.map((res) => {
        const userData = userMap.get(res.userId);
        return {
          ...res,
          userName: userData?.name || "Unknown User",
          userEmail: userData?.email || "",
        };
      });

      setAllReservations(enriched || []);
    } catch (e: any) {
      console.error("Failed to fetch all reservations:", e);
    }
  }, []);

  const fetchReservations = useCallback(async () => {
    setError("");
    try {
      const query =
        user?.role === "admin" ? {} : user?._id ? { userId: user._id } : {};

      const data = await getData<Reservation>("reservations", query);

      let enriched: Reservation[] = data;

      if (user?.role === "admin") {
        const userIds = [...new Set(data.map((r) => r.userId))];

        const usersData = await Promise.all(
          userIds.map(async (userId) => {
            try {
              const users = await getData<any>("users", { _id: userId });
              return users?.[0] ?? null;
            } catch {
              return null;
            }
          })
        );

        const userMap = new Map<string, any>();
        userIds.forEach((userId, idx) => {
          if (usersData[idx]) userMap.set(userId, usersData[idx]);
        });

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
    } catch (e: any) {
      console.error("[fetchReservations] Error:", e);
      setError(e?.message || "Failed to fetch reservations");
    }
  }, [user?.role, user?._id, benches]);

  // ==================== SIMPLE, RELIABLE MESSAGING ====================

  /**
   * Create a message ONCE (best-effort idempotency):
   * 1) Check if message with _id exists
   * 2) If not, insert it
   * 3) If server throws "duplicate", ignore
   */
  const createMessageOnce = useCallback(
    async (
      messageId: string,
      payload: { userId: string; title: string; content: string }
    ) => {
      // quick sanity
      if (!payload.userId) return;

      try {
        const existing = await getData<any>("messages", { _id: messageId });
        if (existing && existing.length > 0) return;

        await setData("messages", {
          _id: messageId,
          userId: payload.userId,
          title: payload.title,
          content: payload.content,
          createdAt: new Date().toISOString(),
          read: false,
        });
      } catch (e: any) {
        const msg = String(e?.message ?? "");
        if (/duplicate|already exists|conflict|409|exists/i.test(msg)) return;
        throw e;
      }
    },
    []
  );

  const notifyBenchOwner = useCallback(
    async (
      reservationKey: string, // can be reservationId or fallback key
      benchId: string,
      reservingUserId: string,
      reservingUserName: string,
      d: string,
      s: string,
      e: string
    ) => {
      try {
        let bench = benches.find((b) => b._id === benchId);

        if (!bench) {
          const benchesData = await getData<Bench>("benches", { _id: benchId });
          bench = benchesData?.[0] ?? null;
        }

        if (!bench?.adminId) return;
        if (bench.adminId === reservingUserId) return;

        const messageId = `msg_new_reservation_${reservationKey}`;
        await createMessageOnce(messageId, {
          userId: bench.adminId,
          title: "New Reservation on Your Bench",
          content: `${reservingUserName} has reserved "${
            bench.name
          }" on ${formatDate(d)} from ${s} to ${e}.`,
        });
      } catch (err) {
        console.error("[notifyBenchOwner] Failed:", err);
      }
    },
    [benches, createMessageOnce]
  );

  // ==================== INITIALIZATION ====================

  useFocusEffect(
    useCallback(() => {
      fetchBenches();
    }, [fetchBenches])
  );

  useEffect(() => {
    if (benches.length > 0 && user?._id) {
      fetchReservations();
      fetchAllReservations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benches.length, user?._id]);

  // ==================== AVAILABILITY HELPERS ====================

  const getBenchOccupancyForDate = (benchId: string, d: string) => {
    return allReservations
      .filter(
        (r) => r.benchId === benchId && r.date === d && r.status === "active"
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

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

  const isStartTimeBlocked = (t: string) => {
    return getDisabledTimeRanges().some(
      (r) => t >= r.startTime && t < r.endTime
    );
  };

  const isEndTimeBlocked = (t: string) => {
    return getDisabledTimeRanges().some(
      (r) => t > r.startTime && t <= r.endTime
    );
  };

  // ==================== FORM PICKERS ====================

  const onDateChange = (event: any, newDate?: Date) => {
    const currentDate = newDate || selectedDate;
    setShowDatePicker(Platform.OS === "ios");
    if (event.type === "set" && currentDate) {
      setSelectedDate(currentDate);
      setDate(formatDateString(currentDate));
    }
  };

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

  // ==================== RESERVATION ACTIONS ====================

  const handleSave = async () => {
    setError("");
    setSuccessMessage("");

    if (!selectedBenchId || !date || !startTime || !endTime) {
      setError("Please fill in all fields");
      return;
    }

    if (!user?._id) {
      setError("User ID is required. Please login again.");
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be after start time");
      return;
    }

    // Overlap check (non-admin only)
    if (user?.role !== "admin") {
      try {
        const existingReservations = await getData<Reservation>(
          "reservations",
          {
            benchId: selectedBenchId,
            date: date.trim(),
            status: "active",
          }
        );

        const overlappingReservation = existingReservations.find((res) => {
          if (editingId && res._id === editingId) return false;
          const resStart = res.startTime.trim();
          const resEnd = res.endTime.trim();
          const newStart = startTime.trim();
          const newEnd = endTime.trim();
          return newStart < resEnd && newEnd > resStart;
        });

        if (overlappingReservation) {
          const day = formatDate(overlappingReservation.date);
          setError(
            `Sala este deja ocupată în data de ${day}, între orele ${overlappingReservation.startTime} – ${overlappingReservation.endTime}. Te rugăm să alegi alt interval.`
          );
          return;
        }
      } catch (e) {
        // don't block save if check fails
        console.warn("[handleSave] Overlap check failed:", e);
      }
    }

    setLoading(true);

    try {
      if (editingId) {
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
        const reservationData = {
          userId: user._id,
          benchId: selectedBenchId,
          date: date.trim(),
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          status: "active",
        };

        const result: any = await setData("reservations", reservationData);
        const reservationId =
          result?.documentId || result?.document?._id || result?._id;

        // Always notify on create (reliable)
        const reservingUserName = user?.name || "Someone";

        // If backend didn’t return an id, use a deterministic fallback key
        const fallbackKey = `${
          user._id
        }_${selectedBenchId}_${date.trim()}_${startTime.trim()}_${endTime.trim()}`;
        await notifyBenchOwner(
          reservationId || fallbackKey,
          selectedBenchId,
          user._id,
          reservingUserName,
          date.trim(),
          startTime.trim(),
          endTime.trim()
        );

        setSuccessMessage("Reservation created successfully");
      }

      // Reset form
      setSelectedBenchId("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setEditingId(null);
      setShowForm(false);

      await fetchReservations();
      await fetchAllReservations();
    } catch (e: any) {
      console.error("[handleSave] Error:", e);
      setError(e?.message || "Failed to save reservation");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      await modifyData("reservations", { _id: id }, { status: "cancelled" });
      setSuccessMessage("Reservation cancelled successfully");
      await fetchReservations();
      await fetchAllReservations();
    } catch (e: any) {
      setError(e?.message || "Failed to cancel reservation");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      await deleteData("reservations", { _id: id });
      setSuccessMessage("Reservation deleted successfully");
      await fetchReservations();
      await fetchAllReservations();
    } catch (e: any) {
      setError(e?.message || "Failed to delete reservation");
    } finally {
      setLoading(false);
    }
  };

  // ==================== FORM HELPERS ====================

  const handleEdit = (reservation: Reservation) => {
    setSelectedBenchId(reservation.benchId);
    setDate(reservation.date);
    setStartTime(reservation.startTime);
    setEndTime(reservation.endTime);

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

  // ==================== STATUS HELPERS ====================

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

  // ==================== CALCULATED VALUES ====================

  const activeReservations = reservations.filter((r) => r.status === "active");
  const upcomingReservations = reservations.filter(
    (r) => r.status === "active" && new Date(r.date) >= new Date()
  );

  // ==================== RENDER ====================

  return (
    <BaseScreen
      title="My Reservations"
      subtitle={
        user?.role === "admin"
          ? "Manage all reservations"
          : "Manage your bench reservations"
      }
      onBack={goBack}
    >
      <ScrollView
        style={tw`flex-1 bg-gray-50`}
        contentContainerStyle={tw`pb-8 px-5`}
      >
        {/* Messages */}
        {error ? (
          <View
            style={tw`bg-red-50 border-l-4 border-red-400 rounded-xl p-4 mb-6 flex-row items-center justify-between shadow-sm`}
          >
            <View style={tw`flex-row items-center gap-3 flex-1`}>
              <Text style={tw`text-red-500 text-xl`}>⚠️</Text>
              <Text style={tw`text-red-800 flex-1 font-medium text-base`}>
                {error}
              </Text>
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
              <Text style={tw`text-emerald-900 font-medium text-base`}>
                {successMessage}
              </Text>
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
                <Text
                  style={tw`text-white font-semibold text-center text-base tracking-wide`}
                >
                  View Benches
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`bg-blue-700 px-6 py-4 rounded-2xl flex-1 flex-row items-center justify-center gap-2 shadow-lg active:opacity-90`}
                onPress={handleNewReservation}
              >
                <Text style={tw`text-white font-bold text-xl`}>+</Text>
                <Text
                  style={tw`text-white font-semibold text-base tracking-wide`}
                >
                  New Reservation
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Form Section */}
        {showForm && (
          <View
            style={tw`bg-white rounded-3xl p-6 mb-8 border border-gray-200`}
          >
            <View
              style={tw`flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200`}
            >
              <View>
                <Text style={tw`text-2xl font-bold text-gray-900`}>
                  {editingId ? "Edit Reservation" : "New Reservation"}
                </Text>
                <Text style={tw`text-gray-600 text-sm mt-1`}>
                  {editingId
                    ? "Update your reservation details"
                    : "Select bench and time slot"}
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
              <Text style={tw`text-base font-semibold mb-3 text-gray-900`}>
                Select Bench *
              </Text>
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
                          <View
                            style={tw`flex-row items-center justify-between mb-2`}
                          >
                            <Text
                              style={tw`font-bold text-base text-gray-900 flex-1`}
                              numberOfLines={1}
                            >
                              {bench.name}
                            </Text>
                            {selectedBenchId === bench._id && (
                              <View
                                style={tw`bg-blue-500 rounded-full w-5 h-5 items-center justify-center ml-2`}
                              >
                                <Text style={tw`text-white text-xs font-bold`}>
                                  ✓
                                </Text>
                              </View>
                            )}
                          </View>

                          <View style={tw`flex-row items-center gap-2 mb-2`}>
                            <Text style={tw`text-gray-500`}>📍</Text>
                            <Text
                              style={tw`text-xs text-gray-700 flex-1`}
                              numberOfLines={1}
                            >
                              {bench.location}
                            </Text>
                          </View>

                          {date && occupiedSlots.length > 0 ? (
                            <View
                              style={tw`mt-2 pt-2 border-t border-gray-200 gap-1.5`}
                            >
                              {occupiedSlots.slice(0, 2).map((r) => {
                                const isMyReservation =
                                  r.userId === user?._id && r._id !== editingId;
                                return (
                                  <View
                                    key={r._id}
                                    style={tw`flex-row items-center gap-2 flex-wrap`}
                                  >
                                    <View
                                      style={tw`w-2 h-2 rounded-full ${
                                        isMyReservation
                                          ? "bg-amber-500"
                                          : "bg-red-500"
                                      }`}
                                    />
                                    <Text
                                      style={tw`${
                                        isMyReservation
                                          ? "text-amber-700"
                                          : "text-red-700"
                                      } text-xs font-medium`}
                                      numberOfLines={1}
                                    >
                                      {isMyReservation
                                        ? "Your reservation"
                                        : "Ocupată"}{" "}
                                      {r.startTime}–{r.endTime}
                                    </Text>
                                    {r.userName && (
                                      <>
                                        <Text style={tw`text-gray-400 text-xs`}>
                                          •
                                        </Text>
                                        <Text
                                          style={tw`text-xs text-gray-600 font-medium`}
                                          numberOfLines={1}
                                        >
                                          {r.userName}
                                        </Text>
                                      </>
                                    )}
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
                            <View
                              style={tw`flex-row items-center gap-2 mt-2 pt-2 border-t border-gray-200`}
                            >
                              <View
                                style={tw`w-2 h-2 rounded-full bg-emerald-500`}
                              />
                              <Text
                                style={tw`text-emerald-700 text-xs font-semibold`}
                              >
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
              <Text style={tw`text-base font-semibold mb-3 text-gray-900`}>
                Date & Time *
              </Text>

              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-medium mb-2 text-gray-700`}>
                  Date
                </Text>
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
                      <Text
                        style={tw`text-gray-900 font-medium text-sm ${
                          !date ? "text-gray-400" : ""
                        }`}
                      >
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

              <View style={tw`flex-row gap-3`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-sm font-medium mb-2 text-gray-700`}>
                    Start Time
                  </Text>
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
                        <Text
                          style={tw`text-gray-900 font-medium text-sm ${
                            !startTime ? "text-gray-400" : ""
                          }`}
                        >
                          {startTime || "Start"}
                        </Text>
                        <Text style={tw`text-gray-500 text-base`}>🕐</Text>
                      </TouchableOpacity>
                      {showStartTimePicker && (
                        <DateTimePicker
                          value={selectedStartTime}
                          mode="time"
                          display={
                            Platform.OS === "ios" ? "spinner" : "default"
                          }
                          onChange={onStartTimeChange}
                        />
                      )}
                    </>
                  )}
                </View>

                <View style={tw`flex-1`}>
                  <Text style={tw`text-sm font-medium mb-2 text-gray-700`}>
                    End Time
                  </Text>
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
                        <Text
                          style={tw`text-gray-900 font-medium text-sm ${
                            !endTime ? "text-gray-400" : ""
                          }`}
                        >
                          {endTime || "End"}
                        </Text>
                        <Text style={tw`text-gray-500 text-base`}>🕐</Text>
                      </TouchableOpacity>
                      {showEndTimePicker && (
                        <DateTimePicker
                          value={selectedEndTime}
                          mode="time"
                          display={
                            Platform.OS === "ios" ? "spinner" : "default"
                          }
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
                <Text style={tw`text-gray-700 font-semibold text-base`}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats Cards */}
        <View style={tw`flex-row gap-5 mb-8`}>
          <View
            style={tw`flex-1 bg-white rounded-3xl p-6 shadow-lg border border-gray-200`}
          >
            <View style={tw`flex-row items-center gap-4`}>
              <View style={tw`p-4 rounded-2xl bg-blue-50`}>
                <Text style={tw`text-2xl`}>📅</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-4xl font-bold text-gray-900 mb-1`}>
                  {reservations.length}
                </Text>
                <Text style={tw`text-sm text-gray-600 font-semibold`}>
                  Total Reservations
                </Text>
              </View>
            </View>
          </View>

          <View
            style={tw`flex-1 bg-white rounded-3xl p-6 shadow-lg border border-gray-200`}
          >
            <View style={tw`flex-row items-center gap-4`}>
              <View style={tw`p-4 rounded-2xl bg-emerald-50`}>
                <Text style={tw`text-2xl`}>✨</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-4xl font-bold text-gray-900 mb-1`}>
                  {activeReservations.length}
                </Text>
                <Text style={tw`text-sm text-gray-600 font-semibold`}>
                  Active
                </Text>
              </View>
            </View>
          </View>

          <View
            style={tw`flex-1 bg-white rounded-3xl p-6 shadow-lg border border-gray-200`}
          >
            <View style={tw`flex-row items-center gap-4`}>
              <View style={tw`p-4 rounded-2xl bg-amber-50`}>
                <Text style={tw`text-2xl`}>⏰</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-4xl font-bold text-gray-900 mb-1`}>
                  {upcomingReservations.length}
                </Text>
                <Text style={tw`text-sm text-gray-600 font-semibold`}>
                  Upcoming
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Reservations List */}
        <View style={tw`mb-6`}>
          <View style={tw`flex-row justify-between items-center mb-6`}>
            <Text style={tw`text-4xl font-bold text-gray-900 tracking-tight`}>
              Your Reservations
            </Text>
            <View
              style={tw`px-5 py-2 rounded-full border border-gray-300 bg-white shadow-sm`}
            >
              <Text style={tw`text-sm text-gray-700 font-semibold`}>
                {reservations.length}{" "}
                {reservations.length === 1 ? "reservation" : "reservations"}
              </Text>
            </View>
          </View>

          {reservations.length === 0 ? (
            <View
              style={tw`bg-white rounded-3xl p-16 items-center border border-gray-200 shadow-lg`}
            >
              <Text style={tw`text-7xl mb-6`}>📅</Text>
              <Text style={tw`text-2xl font-bold mb-3 text-gray-900`}>
                No reservations yet
              </Text>
              <Text style={tw`text-gray-600 mb-8 text-center text-lg`}>
                Create your first reservation to get started.
              </Text>
              <TouchableOpacity
                style={tw`bg-blue-700 px-6 py-4 rounded-2xl flex-row items-center gap-2 shadow-lg active:opacity-90`}
                onPress={handleNewReservation}
              >
                <Text style={tw`text-white font-bold text-xl`}>+</Text>
                <Text
                  style={tw`text-white font-semibold text-base tracking-wide`}
                >
                  Create Reservation
                </Text>
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
                      <Text
                        style={tw`text-3xl font-bold mb-3 text-gray-900 tracking-tight`}
                      >
                        {reservation.benchName}
                      </Text>

                      <View style={tw`flex-row items-center gap-2.5 mb-2`}>
                        <Text style={tw`text-gray-500 text-base`}>📍</Text>
                        <Text style={tw`text-base text-gray-700 font-medium`}>
                          {reservation.location}
                        </Text>
                      </View>

                      {user?.role === "admin" && reservation.userName && (
                        <View style={tw`flex-row items-center gap-2.5 mb-1`}>
                          <Text style={tw`text-gray-500 text-base`}>👤</Text>
                          <Text style={tw`text-base text-gray-800 font-medium`}>
                            {reservation.userName}
                            {reservation.userEmail && (
                              <Text style={tw`text-gray-600`}>
                                {" "}
                                ({reservation.userEmail})
                              </Text>
                            )}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View
                      style={tw`px-5 py-2 rounded-full ${getStatusColor(
                        reservation.status
                      )} shadow-sm`}
                    >
                      <Text
                        style={tw`text-xs font-semibold text-white tracking-wide uppercase`}
                      >
                        {getStatusText(reservation.status)}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={tw`flex-row gap-6 mb-6 pb-5 border-b border-gray-200`}
                  >
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

                  {reservation.status === "active" ? (
                    <View style={tw`flex-row gap-3 pt-2`}>
                      <TouchableOpacity
                        style={tw`flex-1 bg-blue-600 px-5 py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-md active:opacity-90`}
                        onPress={() => handleEdit(reservation)}
                      >
                        <Text style={tw`text-white font-semibold text-base`}>
                          ✏️
                        </Text>
                        <Text style={tw`text-white font-semibold text-base`}>
                          Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={tw`flex-1 bg-orange-600 px-5 py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-md active:opacity-90`}
                        onPress={() => handleCancel(reservation._id)}
                      >
                        <Text style={tw`text-white font-semibold text-base`}>
                          ✖️
                        </Text>
                        <Text style={tw`text-white font-semibold text-base`}>
                          Cancel
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={tw`flex-1 bg-red-600 px-5 py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-md active:opacity-90`}
                        onPress={() => handleDelete(reservation._id)}
                      >
                        <Text style={tw`text-white font-semibold text-base`}>
                          🗑️
                        </Text>
                        <Text style={tw`text-white font-semibold text-base`}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={tw`flex-row gap-3 pt-2`}>
                      <TouchableOpacity
                        style={tw`flex-1 bg-red-600 px-5 py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-md active:opacity-90`}
                        onPress={() => handleDelete(reservation._id)}
                      >
                        <Text style={tw`text-white font-semibold text-base`}>
                          🗑️
                        </Text>
                        <Text style={tw`text-white font-semibold text-base`}>
                          Delete
                        </Text>
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
