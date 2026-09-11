import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
  Linking,
  RefreshControl,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import { fetchRequirementById } from "../../store/slices/requirementsSlice";
import { LinearGradient } from "expo-linear-gradient";
import SkeletonLoader from "../../components/SkeletonLoader";

import TabTimeline from "../../components/customerDetails/TabTimeline";

export default function CustomerDetails() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { id } = useLocalSearchParams();
  const requirement = useSelector((state) => state.requirements.currentRequirement);
  const loading = useSelector((state) => state.requirements.loading);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      await dispatch(fetchRequirementById(id));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchRequirementById(id));
    }
  }, [dispatch, id]);

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

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading && !requirement) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <View className="px-4 py-4">
          <SkeletonLoader width="100%" height={150} style={{ borderRadius: 16, marginBottom: 18 }} />
          <SkeletonLoader width="100%" height={250} style={{ borderRadius: 16, marginBottom: 18 }} />
          <SkeletonLoader width="100%" height={100} style={{ borderRadius: 16, marginBottom: 18 }} />
        </View>
      </View>
    );
  }

  if (!requirement) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="font-lato-bold text-gray-500">Requirement not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4 bg-[#4A43EC] px-6 py-2 rounded-full">
          <Text className="text-white font-lato-bold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const RequirementRow = ({ icon, label, value, isMCI = false }) => (
    <View className="flex-row items-center justify-between py-2.5">
      <View className="flex-row items-center">
        <View className="w-8 items-center">
          {isMCI ? (
            <MaterialCommunityIcons name={icon} size={18} color="#4A43EC" />
          ) : (
            <Ionicons name={icon} size={18} color="#4A43EC" />
          )}
        </View>
        <Text className="text-gray-400 text-sm font-lato-regular ml-1">{label}</Text>
      </View>
      <Text className="text-black text-sm font-lato-regular text-right flex-1 ml-4" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F9FAFF]">
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
          Customer Details
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4A43EC"]}
            tintColor="#4A43EC"
          />
        }
      >
        <View className="px-4 py-4">
          {/* Main Profile Card */}
          <LinearGradient
            colors={["#4A43EC", "#C4C1FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, padding: 18, marginBottom: 18, elevation: 8, overflow: 'hidden' }}
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-white text-2xl font-lato-bold">{requirement.customer_name}</Text>
                  <MaterialCommunityIcons name="check-decagram" size={20} color="white" />
                </View>
                <Text className="text-white/80 text-xs font-lato-regular mb-3">
                  Added on {formatDate(requirement.created_at)}
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="phone-portrait-outline" size={16} color="white" />
                  <Text className="text-white ml-2 text-sm font-lato-bold">{requirement.contact_number}</Text>
                </View>
              </View>
              <Pressable 
                onPress={() => Linking.openURL(`tel:${requirement.contact_number}`)}
                className="bg-white w-12 h-12 rounded-full items-center justify-center shadow-sm"
              >
                <Ionicons name="call" size={20} color="#4A43EC" />
              </Pressable>
            </View>
          </LinearGradient>

          {/* Requirements Section */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
            <Text className="text-[#4A43EC] text-sm font-lato-bold mb-3 tracking-wide">REQUIREMENTS</Text>

            <RequirementRow icon="currency-inr" label="Budget Range" value={`${formatCurrency(requirement.budget_min)} - ${formatCurrency(requirement.budget_max)}`} isMCI />
            <RequirementRow icon="list-outline" label="Listing Type" value={requirement.requirement_type} />
            <RequirementRow icon="home-outline" label="Property Type" value={requirement.property_type} />
            <RequirementRow icon="location" label="Locations" value={requirement.preferred_locations?.join(', ') || "N/A"} />
          </View>

          {/* Preferred Locations Section */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
            <Text className="text-[#4A43EC] text-sm font-lato-bold mb-3 tracking-wide">PREFERRED LOCATIONS</Text>
            <View className="flex-row flex-wrap gap-2">
              {requirement.preferred_locations?.map((loc, index) => (
                <View key={index} className="border border-[#4A43EC]/20 rounded-full px-4 py-2 flex-row items-center self-start">
                  <Ionicons name="location" size={16} color="#4A43EC" />
                  <Text className="text-[#4A43EC] text-[11px] font-lato-regular ml-2">
                    {loc}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Property Details Section */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
            <Text className="text-[#4A43EC] text-sm font-lato-bold mb-3 tracking-wide">PROPERTY DETAILS</Text>
            <Text className="text-gray-500 text-sm font-lato-regular leading-5">
              {requirement.notes}
            </Text>
          </View>

          {/* Timeline Section */}
          <TabTimeline requirementId={requirement.id} />
        </View>
      </ScrollView>
    </View>
  );
}
