import { View, Text, Pressable, StatusBar, Platform, ScrollView, Image, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { markAllAsWatched, markAllReadApi, markAsWatched, fetchNotifications } from "../../store/slices/notificationSlice";
import { resolveNotificationRoute } from "../../utils/notificationRoutes";

export default function Notifications() {
  const router = useRouter();
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notifications?.list || []);
  const loading = useSelector((state) => state.notifications?.loading || false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchNotifications());
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const getIcon = (type) => {
    switch (type) {
      case 'customer':
        return (
          <View className="w-12 h-12 rounded-full bg-[#FFF3D6] items-center justify-center">
            <MaterialCommunityIcons name="account-search" size={24} color="#FFB800" />
          </View>
        );
      case 'success':
        return (
          <View className="w-12 h-12 rounded-full bg-[#E8EAFD] items-center justify-center">
            <Ionicons name="checkmark-circle" size={28} color="#4A43EC" />
          </View>
        );
      case 'error':
        return (
          <View className="w-12 h-12 rounded-full bg-[#FEEBF0] items-center justify-center">
            <Ionicons name="close-circle" size={28} color="#FF3B30" />
          </View>
        );
      case 'love':
        return (
          <View className="w-12 h-12 rounded-full bg-[#FFEBEE] items-center justify-center">
            <Ionicons name="heart" size={24} color="#FF3B30" />
          </View>
        );
      default:
        return (
          <View className="w-12 h-12 rounded-full bg-[#EBF1FF] items-center justify-center">
            <Ionicons name="notifications" size={24} color="#4A43EC" />
          </View>
        );
    }
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <View
        className="flex-row items-center justify-between px-5 pb-3 mt-2"
        style={{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 8 : 45 }}
      >
        <Pressable onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={22} color="black" />
        </Pressable>
        <Text className="text-[17px] text-[#1F2937] font-lato-bold">Notifications</Text>
        <Pressable 
          onPress={() => {
            dispatch(markAllAsWatched());
            dispatch(markAllReadApi());
          }}
          className="bg-[#4A43EC]/10 px-3 py-1.5 rounded-lg"
        >
          <Text className="text-[#4A43EC] text-[11px] font-manrope-bold">Mark all read</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4A43EC" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10 -mt-20">
          <Image
            source={require("../../assets/images/Ilustration mailbox.png")}
            style={{ width: 180, height: 180, resizeMode: 'contain' }}
          />
          <Text className="text-[16px] font-manrope-bold text-[#1F2937] mt-5 text-center">
            No notification yet
          </Text>
          <Text className="text-[12px] font-manrope-medium text-[#9CA3AF] mt-2.5 text-center leading-5">
            All notification we send will appear here, so you can view them easly anytime.
          </Text>
        </View>
      ) : (
        <ScrollView
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
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 }}
        >
          {notifications.map((item) => (
            <View
              key={item.id}
              className="flex-row mb-6 relative"
            >
              {getIcon(item.type)}
              <View className="ml-4 flex-1">
                <Text className={`text-[15px] ${item.watched ? 'text-[#6B7280]' : 'text-[#1F2937]'} font-manrope-bold mb-0.5`}>
                  {item.title}
                </Text>
                <Text className="text-[13px] text-[#9CA3AF] font-manrope-medium leading-5">
                  {item.description}
                </Text>
                <Text className="text-[10px] text-[#9CA3AF] font-manrope-medium italic self-end mt-1">
                  {item.time}
                </Text>
              </View>
              {!item.watched && (
                <View className="absolute top-1 right-0 w-2 h-2 bg-[#4A43EC] rounded-full" />
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
