import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StatusBar,
  Platform,
  Modal,
  RefreshControl,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import { fetchRequirements, deleteRequirementApi } from "../../store/slices/requirementsSlice";
import { LinearGradient } from "expo-linear-gradient";
import SkeletonLoader from "../../components/SkeletonLoader";

const formatCurrency = (val) => {
  if (!val) return "N/A";
  if (val >= 10000000) {
     return `₹ ${Math.floor(val/10000000)} Cr+`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val).replace('₹', '₹ ');
};

export default function CustomerRequirement() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const requirements = useSelector((state) => state.requirements?.list || []);
  const loading = useSelector((state) => state.requirements?.loading);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchRequirements({ search: searchQuery }));
  }, [dispatch, searchQuery]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await dispatch(fetchRequirements({ search: searchQuery }));
    setIsRefreshing(false);
  }, [dispatch, searchQuery]);

  // The filtering is now handled by the API via searchQuery in useEffect,
  // but we can still keep local filtering for smoother UI if needed.
  const filteredRequirements = requirements;

  const handleDeletePress = useCallback((id) => {
    setSelectedId(id);
    setDeleteModalVisible(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (selectedId) {
      try {
        await dispatch(deleteRequirementApi(selectedId)).unwrap();
        setDeleteModalVisible(false);
        setSelectedId(null);
      } catch (err) {
        alert(err || "Failed to delete");
      }
    }
  }, [selectedId, dispatch]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        className="flex-row items-center px-4 py-2 bg-white"
        style={{ paddingTop: Math.max(insets.top, 10) }}
      >
        <Pressable onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={20} color="black" />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-lato-bold mr-8">
          Customer Requirement
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-4 mb-3">
        <View className="flex-row items-center bg-[#F4F7FF] rounded-lg px-3 py-1">
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search"
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2 text-sm font-lato-regular h-10"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingBottom: 80,
          flexGrow: filteredRequirements.length === 0 ? 1 : 0
        }}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#4A43EC"]} tintColor="#4A43EC" />
        }
      >
        {loading && !isRefreshing ? (
          // Skeleton Loaders
          [1, 2, 3].map((i) => (
            <View key={i} className="bg-white rounded-2xl mb-4 overflow-hidden border border-gray-100 p-4">
              <SkeletonLoader width="60%" height={20} style={{ marginBottom: 10 }} />
              <SkeletonLoader width="40%" height={15} style={{ marginBottom: 20 }} />
              <SkeletonLoader width="100%" height={60} style={{ borderRadius: 12, marginBottom: 15 }} />
              <View className="flex-row gap-2">
                <SkeletonLoader width="30%" height={35} style={{ borderRadius: 10 }} />
                <SkeletonLoader width="30%" height={35} style={{ borderRadius: 10 }} />
                <SkeletonLoader width="30%" height={35} style={{ borderRadius: 10 }} />
              </View>
            </View>
          ))
        ) : filteredRequirements.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <View className="bg-[#F4F7FF] w-24 h-24 rounded-full items-center justify-center mb-6">
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#4A43EC" />
            </View>
            <Text className="text-xl font-lato-bold text-gray-900 mb-2">No Requirements Found</Text>
            <Text className="text-gray-400 font-lato-regular text-center px-10 leading-5">
              {searchQuery
                ? `We couldn't find any requirement matching "${searchQuery}"`
                : "You haven't added any customer requirements yet. Start by adding one!"}
            </Text>
          </View>
        ) : (
          filteredRequirements.map((req) => (
            <View key={req.id} className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm border border-gray-200" style={{ elevation: 2 }}>
              {/* Card Header */}
              <LinearGradient
                colors={["#4A43EC", "#C4C1FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12
                }}
              >
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-white text-base font-lato-bold">{req.customer_name}</Text>
                  <MaterialCommunityIcons name="check-decagram" size={16} color="white" />
                </View>
                <View className="bg-white px-3 py-0.5 rounded-full">
                  <Text className="text-[#4A43EC] text-[10px] font-lato-bold uppercase tracking-wider">
                    {req.requirement_type === "sell" ? "Buy" : req.requirement_type === "buy" ? "Buy" : req.requirement_type === "rent" ? "Rent/Lease" : req.requirement_type === "paying_guest" ? "Paying Guest" : req.requirement_type}
                  </Text>
                </View>
              </LinearGradient>

              {/* Card Body */}
              <View className="p-4">
                {/* Info Row */}
                <View className="flex-row justify-between mb-3">
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="office-building-marker-outline" size={16} color="#4A43EC" />
                    <Text className="ml-1 text-[10px] text-[#4A43EC] font-lato-bold">{req.property_type}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="map-marker-outline" size={16} color="#4A43EC" />
                    <Text className="ml-1 text-[10px] text-[#4A43EC] font-lato-bold" numberOfLines={1}>{req.preferred_locations?.[0] || "N/A"}</Text>
                  </View>
                </View>


                {/* Budget Box */}
                <View className="bg-[#F8F9FE] rounded-lg p-3 flex-row items-center mb-3">
                  <View className="mr-2">
                    <MaterialCommunityIcons name="currency-inr" size={20} color="#4A43EC" />
                  </View>
                  <View>
                    <Text className="text-[9px] text-gray-400 font-lato-regular">Budget Range</Text>
                    <Text className="text-xs font-lato-bold text-black">{formatCurrency(req.budget_min)} - {formatCurrency(req.budget_max)}</Text>
                  </View>
                </View>

                {/* Notes */}
                <Text className="text-xs text-gray-500 font-lato-regular mb-4" numberOfLines={1}>{req.notes}</Text>

                {/* Action Buttons */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => router.push({
                      pathname: "/(screens)/add-customer-requirement",
                      params: { id: req.id }
                    })}
                    className="flex-1 flex-row items-center justify-center bg-white border border-gray-200 py-1.5 rounded-lg"
                  >
                    <MaterialCommunityIcons name="pencil" size={14} color="#4A43EC" />
                    <Text className="ml-1.5 text-[#4A43EC] font-lato-bold">Edit</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push({
                      pathname: "/(screens)/customer-details",
                      params: { id: req.id }
                    })}
                    className="flex-1 flex-row items-center justify-center bg-[#4A43EC] py-1.5 rounded-lg"
                  >
                    <Ionicons name="eye-outline" size={14} color="white" />
                    <Text className="ml-1.5 text-white font-lato-bold">View</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleDeletePress(req.id)}
                    className="flex-1 flex-row items-center justify-center bg-[#EF4444] py-1.5 rounded-lg"
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={14} color="white" />
                    <Text className="ml-1.5 text-white font-lato-bold">Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white w-full rounded-3xl p-6 items-center shadow-xl">
            <View className="bg-red-50 w-16 h-16 rounded-full items-center justify-center mb-4">
              <MaterialCommunityIcons name="trash-can-outline" size={32} color="#EF4444" />
            </View>

            <Text className="text-xl font-lato-bold text-gray-900 mb-2 text-center">Delete Requirement?</Text>
            <Text className="text-gray-500 font-lato-regular text-center mb-8 px-4 leading-5">
              Are you sure you want to delete this customer requirement? This action cannot be undone.
            </Text>

            <View className="flex-row gap-3 w-full">
              <Pressable
                onPress={() => setDeleteModalVisible(false)}
                className="flex-1 bg-gray-100 py-3.5 rounded-2xl items-center"
              >
                <Text className="text-gray-600 font-lato-bold">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={confirmDelete}
                className="flex-1 bg-[#EF4444] py-3.5 rounded-2xl items-center"
              >
                <Text className="text-white font-lato-bold">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sticky Footer */}
      <View
        className="bg-[#4A43EC] items-center justify-center"
        style={{ 
          paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom + 15, 25) : Math.max(insets.bottom, 12), 
          paddingTop: 12 
        }}
      >
        <Pressable
          onPress={() => router.push("/(screens)/add-customer-requirement")}
          className="w-full items-center justify-center"
        >
          <Text className="text-white font-lato-bold tracking-wide">Add New Requirement</Text>
        </Pressable>
      </View>
    </View>
  );
}
