import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import BaseScreen from "../../components/BaseScreen";
import useStackNavigation from "../../hooks/useStackNavigation";
import { MainStackParamList } from "../../types/navigation";
import {
  getData,
  deleteData,
  modifyData,
  onDatabaseChange,
  type DatabaseChangeMessage,
} from "../../utils/exportHelpers";
import { useAuth } from "../../contexts/AuthContext";
import tw from "twrnc";

type Message = {
  _id: string;
  userId: string;
  title: string;
  content: string;
  isOpened: boolean;
  createdAt?: string;
  [key: string]: any;
};

export default function Messages() {
  const { goBack } = useStackNavigation<MainStackParamList>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  // Fetch messages for the current user
  const fetchMessages = useCallback(async () => {
    if (!user?._id) return;

    setFetching(true);
    setError("");
    try {
      const messagesData = await getData<Message>("messages", {
        userId: user._id,
      });
      // Sort by createdAt descending (newest first)
      const sorted = (messagesData || []).sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setMessages(sorted);
    } catch (error: any) {
      setError(error.message || "Failed to fetch messages");
    } finally {
      setFetching(false);
    }
  }, [user?._id]);

  // Fetch messages on mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Refresh messages when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchMessages();
    }, [fetchMessages])
  );

  // Listen for real-time database changes
  useEffect(() => {
    if (!user?._id) return;

    const cleanup = onDatabaseChange((message: DatabaseChangeMessage) => {
      // Refetch messages when messages collection changes
      if (message.collection === "messages") {
        fetchMessages();
      }
    });

    return cleanup;
  }, [user?._id, fetchMessages]);

  // Mark message as opened
  const handleOpenMessage = async (messageId: string) => {
    try {
      await modifyData("messages", { _id: messageId }, { isOpened: true });
      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, isOpened: true } : msg
        )
      );
    } catch (error: any) {
      setError(error.message || "Failed to mark message as read");
    }
  };

  // Delete message
  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  // Confirm delete message
  const confirmDelete = async () => {
    if (!confirmDeleteId) return;

    setLoading(true);
    setError("");
    try {
      await deleteData("messages", { _id: confirmDeleteId });
      await fetchMessages();
      setConfirmDeleteId(null);
    } catch (error: any) {
      setError(error.message || "Failed to delete message");
    } finally {
      setLoading(false);
    }
  };

  // Delete all messages
  const handleDeleteAll = () => {
    setConfirmDeleteAll(true);
  };

  // Confirm delete all
  const confirmDeleteAllMessages = async () => {
    setLoading(true);
    setError("");
    try {
      // Delete all messages for the current user
      const deletePromises = messages.map((msg) =>
        deleteData("messages", { _id: msg._id })
      );
      await Promise.all(deletePromises);
      await fetchMessages();
      setConfirmDeleteAll(false);
    } catch (error: any) {
      setError(error.message || "Failed to delete messages");
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const unreadCount = messages.filter((msg) => !msg.isOpened).length;

  return (
    <BaseScreen
      title="Messages"
      subtitle={`You have ${unreadCount} unread message${
        unreadCount !== 1 ? "s" : ""
      }`}
      onBack={goBack}
    >
      <ScrollView
        style={tw`flex-1 bg-white`}
        contentContainerStyle={tw`pb-8 px-5`}
        nestedScrollEnabled={true}
      >
        {/* Error Message */}
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

        {/* Delete Confirmation */}
        {confirmDeleteId && (
          <View
            style={tw`bg-yellow-50 border-l-4 border-yellow-400 rounded-xl p-4 mb-6 shadow-sm`}
          >
            <Text style={tw`text-yellow-800 font-semibold text-base mb-3`}>
              Are you sure you want to delete this message?
            </Text>
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                style={tw`flex-1 bg-red-600 px-4 py-2 rounded-xl`}
                onPress={confirmDelete}
                disabled={loading}
              >
                <Text style={tw`text-white font-semibold text-center`}>
                  Delete
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-gray-200 px-4 py-2 rounded-xl`}
                onPress={() => setConfirmDeleteId(null)}
                disabled={loading}
              >
                <Text style={tw`text-gray-700 font-semibold text-center`}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Delete All Confirmation */}
        {confirmDeleteAll && (
          <View
            style={tw`bg-yellow-50 border-l-4 border-yellow-400 rounded-xl p-4 mb-6 shadow-sm`}
          >
            <Text style={tw`text-yellow-800 font-semibold text-base mb-3`}>
              Are you sure you want to delete all messages?
            </Text>
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                style={tw`flex-1 bg-red-600 px-4 py-2 rounded-xl`}
                onPress={confirmDeleteAllMessages}
                disabled={loading}
              >
                <Text style={tw`text-white font-semibold text-center`}>
                  Delete All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-gray-200 px-4 py-2 rounded-xl`}
                onPress={() => setConfirmDeleteAll(false)}
                disabled={loading}
              >
                <Text style={tw`text-gray-700 font-semibold text-center`}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {messages.length > 0 && (
          <View style={tw`mb-6 flex-row gap-4`}>
            <TouchableOpacity
              style={tw`flex-1 bg-red-600 px-6 py-4 rounded-2xl shadow-lg active:opacity-90`}
              onPress={handleDeleteAll}
              disabled={loading}
            >
              <Text
                style={tw`text-white font-semibold text-center text-base tracking-wide`}
              >
                Delete All
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Indicator */}
        {fetching && messages.length === 0 ? (
          <View style={tw`items-center justify-center py-20`}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={tw`text-gray-600 mt-4 text-base`}>
              Loading messages...
            </Text>
          </View>
        ) : messages.length === 0 ? (
          <View
            style={tw`bg-white rounded-3xl p-16 items-center border border-gray-300 shadow-lg`}
          >
            <Text style={tw`text-7xl mb-6`}>📬</Text>
            <Text style={tw`text-2xl font-bold mb-3 text-gray-900`}>
              No messages yet
            </Text>
            <Text style={tw`text-gray-600 text-center text-lg`}>
              Your messages will appear here
            </Text>
          </View>
        ) : (
          <View style={tw`gap-4`}>
            {messages.map((message) => (
              <TouchableOpacity
                key={message._id}
                onPress={() => handleOpenMessage(message._id)}
                style={tw`bg-white rounded-3xl p-6 border ${
                  message.isOpened
                    ? "border-gray-300"
                    : "border-blue-500 border-2"
                } shadow-lg`}
              >
                <View style={tw`flex-row justify-between items-start mb-3`}>
                  <View style={tw`flex-1`}>
                    <View style={tw`flex-row items-center gap-2 mb-2`}>
                      {!message.isOpened && (
                        <View style={tw`w-3 h-3 rounded-full bg-blue-500`} />
                      )}
                      <Text
                        style={tw`text-xl font-bold text-gray-900 ${
                          !message.isOpened ? "font-extrabold" : ""
                        }`}
                      >
                        {message.title}
                      </Text>
                    </View>
                    <Text style={tw`text-xs text-gray-500 mb-3`}>
                      {formatDate(message.createdAt)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(message._id);
                    }}
                    style={tw`p-2 rounded-xl active:bg-red-50`}
                    disabled={loading}
                  >
                    <Text style={tw`text-red-600 text-lg font-bold`}>🗑️</Text>
                  </TouchableOpacity>
                </View>
                <Text
                  style={tw`text-base text-gray-700 leading-6 ${
                    !message.isOpened ? "font-medium" : ""
                  }`}
                >
                  {message.content}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </BaseScreen>
  );
}
