import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { fetchBrokerStats, fetchMyProjects } from "../../store/slices/brokerSlice";
import { fetchUserProfile, fetchKyc } from "../../store/slices/authSlice";
import { fetchShortlistedProperties } from "../../store/slices/propertySlice";
import { fetchNotifications } from "../../store/slices/notificationSlice";
import { sanitizeS3Url } from "../../utils/s3ImageUrl";

const { width } = Dimensions.get("window");

const EMPTY_PROPERTIES = [];
const buyFilter = "Customer Requirement";

const formatIndianEarningAmount = (amount) => {
  const numericAmount = Number(amount);

  if (amount === null || amount === undefined || !Number.isFinite(numericAmount) || numericAmount <= 0) {
    return "₹0";
  }

  if (numericAmount >= 10000000) {
    const cr = (numericAmount / 10000000).toFixed(2).replace(/\.00$/, "").replace(/(\.[1-9])0$/, "$1");
    return `₹${cr} Cr`;
  }

  if (numericAmount >= 100000) {
    const lakh = (numericAmount / 100000).toFixed(2).replace(/\.00$/, "").replace(/(\.[1-9])0$/, "$1");
    return `₹${lakh} Lakh`;
  }

  if (numericAmount >= 1000) {
    const k = (numericAmount / 1000).toFixed(1).replace(/\.0$/, "");
    return `₹${k} K`;
  }

  return `₹${numericAmount.toLocaleString("en-IN")}`;
};

const propertyCategories = [
  {
    id: "residential",
    label: "Residential",
    image: require("../../assets/icons/property-types/House2.png"),
    cloudImage: require("../../assets/icons/property-types/Clouds.png"),
    subTypes: [
      { id: "plot", label: "Plot", image: require("../../assets/icons/property-types/plot.png") },
      { id: "villa", label: "Villa", image: require("../../assets/icons/property-types/villa.png") },
      { id: "apartment", label: "Apartment", image: require("../../assets/icons/property-types/apartment.png") },
      { id: "rowhouse", label: "Rowhouse", image: require("../../assets/icons/property-types/rowhouse.png") },
    ]
  },
  {
    id: "commercial",
    label: "Commercial",
    image: require("../../assets/icons/property-types/commercial.png"),
    subTypes: [
      { id: "shop", label: "Shop", image: require("../../assets/icons/property-types/Shop.png") },
      { id: "showroom", label: "Showroom", image: require("../../assets/icons/property-types/showroom.png") },
      { id: "office", label: "Office", image: require("../../assets/icons/property-types/office.png") },
    ]
  }
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("residential");
  const [selectedPropertyType, setSelectedPropertyType] = useState(null);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const dispatch = useDispatch();
  const unwatchedCount = useSelector(state => state.notifications?.list?.filter(n => !n.watched && !n.is_read).length || 0);
  const brokerStats = useSelector(state => state.broker?.stats);
  const user = useSelector(state => state.auth?.user);
  const kyc = useSelector(state => state.auth?.kyc);
  const shortlistedProperties = useSelector(state => state.property?.shortlistedProperties) ?? EMPTY_PROPERTIES;
  const shortlistedLoading = useSelector(state => state.property?.shortlistedLoading || false);

  const loadHomeData = useCallback(async () => {
    await Promise.allSettled([
      dispatch(fetchBrokerStats()),
      dispatch(fetchMyProjects()),
      dispatch(fetchUserProfile()),
      dispatch(fetchKyc()),
      dispatch(fetchNotifications()),
    ]);
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadHomeData();
    } finally {
      setRefreshing(false);
    }
  }, [loadHomeData]);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  const stats = useMemo(() => [
    { label: "Total Properties", count: brokerStats?.total_properties ?? 0 },
    { label: "Total Sale",       count: brokerStats?.sales            ?? 0 },
    { label: "Pending",          count: brokerStats?.pending          ?? 0 },
    { label: "Rejected",         count: brokerStats?.rejected         ?? 0 },
  ], [brokerStats?.total_properties, brokerStats?.sales, brokerStats?.pending, brokerStats?.rejected]);

  const currentSubTypes = useMemo(() => {
    if (!selectedCategory) return [];
    const category = propertyCategories.find(c => c.id === selectedCategory);
    return category?.subTypes || [];
  }, [selectedCategory]);
  
  const shortlistedCount = useMemo(() => {
    return shortlistedProperties.length;
  }, [shortlistedProperties]);

  const branchEarningSummary = useMemo(() => {
    const summary = brokerStats?.branch_channel_partner_earning_summary || brokerStats?.branchEarningSummary || {};
    const channelPartnerCount =
      summary.channel_partner_count ??
      summary.channelPartnerCount ??
      brokerStats?.branch_channel_partner_count ??
      brokerStats?.branchChannelPartnerCount ??
      brokerStats?.channel_partner_count ??
      0;
    const monthlyEarningLabel =
      summary.max_monthly_earning_label ??
      summary.maxMonthlyEarningLabel ??
      brokerStats?.branch_max_monthly_earning_label ??
      brokerStats?.branchMaxMonthlyEarningLabel ??
      formatIndianEarningAmount(
        summary.max_monthly_earning ??
        summary.maxMonthlyEarning ??
        brokerStats?.branch_max_monthly_earning ??
        brokerStats?.branchMaxMonthlyEarning
      );
    const branchName =
      summary.branch_name ??
      summary.branchName ??
      brokerStats?.branch_name ??
      brokerStats?.branchName ??
      null;

    return {
      channelPartnerCount,
      monthlyEarningLabel,
      branchName,
    };
  }, [brokerStats]);

  const handleFilterPress = useCallback((filter) => {
    if (filter === "Customer Requirement") {
      router.push("/(screens)/customer-requirement");
    }
  }, []);
  
  const handleCategoryPress = useCallback((categoryId) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
    setSelectedPropertyType(null);
  }, []);
  
  const handlePropertyTypePress = useCallback((typeId) => {
    setSelectedPropertyType(typeId);
    
    if (selectedCategory && typeId) {
      dispatch(fetchShortlistedProperties({
        category: selectedCategory,
        property_type: typeId
      }));
    }
    
    router.push({ pathname: "/(screens)/property-type", params: { typeId, category: selectedCategory } });
  }, [selectedCategory, dispatch]);

  const formatDate = (dateString) => {
    if (!dateString) return "Recently joined";
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const displayName = useMemo(
    () => [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.full_name || user?.name || "User",
    [user?.first_name, user?.last_name, user?.full_name, user?.name]
  );
  const displayDate = useMemo(
    () => (user?.created_at ? formatDate(user.created_at) : "Recently joined"),
    [user?.created_at]
  );

  const getValidImageUrl = (...candidates) => {
    for (const url of candidates) {
      if (typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:image"))) {
        return sanitizeS3Url(url);
      }
    }
    return null;
  };

  const avatarUrl = useMemo(
    () => getValidImageUrl(user?.profilePictureUrl, kyc?.profile_photo_url, user?.avatar_url),
    [user?.profilePictureUrl, kyc?.profile_photo_url, user?.avatar_url]
  );

  useEffect(() => {
    setAvatarLoadError(false);
  }, [avatarUrl]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 160 }} 
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4D45ED", "#362ddc"]}
            tintColor="#ffffff"
            progressViewOffset={Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 10 : 0}
          />
        }
        className="bg-white"
      >
        
        {/* 🔵 COHESIVE NATIVE BLUE DECK BLOCK (Houses top profile element layers perfectly) */}
        <View style={{ backgroundColor: '#362ddc', position: 'relative' }}>
          
          {/* User Profile Info Layer */}
          <View
            style={{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 70 }}
            className="px-6 pb-[75px]"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-3">
                <View className="w-14 h-14 rounded-2xl bg-white overflow-hidden items-center justify-center border border-white/20 shadow-sm">
                  {avatarUrl && !avatarLoadError ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                      onError={() => setAvatarLoadError(true)}
                    />
                  ) : (
                    <Text className="text-[#362ddc] text-[22px] font-lato-black">
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-white text-lg font-lato-bold">
                      {displayName}
                    </Text>
                    <MaterialCommunityIcons name="check-circle" size={16} color="#3AFF08" />
                  </View>
                  <Text className="text-xs text-white/70 mt-0.5">{displayDate}</Text>
                </View>
              </View>
              
              <View className="flex-row items-center gap-3">
                <Pressable className="p-1" onPress={() => router.push("/(screens)/wallet")}>
                  <Ionicons name="wallet" size={24} color="white" />
                </Pressable>
                <Pressable className="p-1 relative" onPress={() => router.push("/(screens)/notifications")}>
                  <Ionicons name="notifications" size={24} color="white" />
                  {unwatchedCount > 0 ? (
                    <View className="absolute top-0 right-0 bg-[#FF3B30] min-w-[14px] h-[14px] rounded-full items-center justify-center border border-white">
                      <Text className="text-white text-[8px] font-manrope-bold">{unwatchedCount}</Text>
                    </View>
                  ) : null}
                </Pressable>
              </View>
            </View>
          </View>

          {/* 📊 FLOATING MATRIX SUB-DECK BAR (Overlayed via calculated margin offsets natively) */}
          <View
            className="bg-white rounded-[24px] p-[12px] mx-[16px] shadow-xl shadow-black/10"
            style={{ 
              position: 'absolute',
              bottom: -40, // Standard anchor pushes exactly half the element below the blue background barrier
              left: 0,
              right: 0,
              zIndex: 10,
              elevation: 8 
            }}
          >
            <View className="flex-row justify-between gap-2.5">
              {stats.map((s, i) => (
                <View key={i} className="flex-1 bg-[#F4F7FF] rounded-xl py-3.5 items-center justify-center border border-[#EDF2F7]">
                  <Text className="text-base text-[#1A1A1A] font-manrope-bold">{s.count}</Text>
                  <Text className="text-[9px] mt-0.5 text-gray-500 text-center font-manrope-semibold">{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 🎞️ NATIVE GRAPHIC MARKETING BANNER SLIDER (Rendered inside natural linear stream to eliminate grey rendering traps) */}
        <View style={{ backgroundColor: '#3d34e5ff', paddingTop:40, paddingBottom: 9}}>
          <Image
            source={require("../../assets/images/banner2.png")}
            style={{ width: '100%', height: 175 }}
            resizeMode="cover"
          />
        </View>

        {/* 🏛️ CLEAN LOWER MAIN WHITE CONTENT SECTION */}
        <View 
          style={{ 
            paddingTop: 20, 
            backgroundColor: '#ffffff', 
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            marginTop: -20, // Clean overlap style match with the image above
            zIndex: 100,
          }}
          className="px-4"
        >
          {/* Action Button Switch row */}
          {/* Action Switch Tabs row */}
          <View className="flex-row gap-3 mb-6">
            <Pressable
              onPress={() => handleFilterPress("SELL")}
              style={{ flex: 1 }}
              className="h-11 bg-white rounded-full flex-row justify-center items-center border border-[#E5E7EB] shadow-xs px-3"
            >
              <MaterialCommunityIcons 
                name="filter-variant" 
                size={18} 
                color="#374151" 
              />
              <Text className="text-[13px] text-gray-700 font-lato-bold ml-1.5" numberOfLines={1}>
                Resale
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleFilterPress(buyFilter)}
              style={{ flex: 1 }}
              className="h-11 bg-white rounded-full flex-row justify-center items-center border border-[#E5E7EB] shadow-xs px-3"
            >
              <Ionicons name="add" size={18} color="#374151" />
              <Text className="text-[12px] text-gray-700 font-lato-bold ml-1" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                Add Customer Req.
              </Text>
            </Pressable>
          </View>

          {/* Branch channel partner earning summary banner layout */}
          <View className="mb-6 items-center">
            {/* Top decorative layer */}
            <View
              style={{
                height: 8.5,
                width: '82%',
                backgroundColor: '#E1E0FF',
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
              }}
            />
            {/* Middle decorative layer */}
            <View
              style={{
                height: 8.5,
                width: '92%',
                backgroundColor: '#ADAAFF',
                borderTopLeftRadius: 14,
                borderTopRightRadius: 14,
              }}
            />
            {/* Main Card */}
            <View className="w-full overflow-hidden rounded-[20px] bg-white border border-[#E5E7EB] shadow-xs">
              <View className="flex-row items-center py-5 px-4 gap-3">
                <Image
                  source={require("../../assets/images/wallet.png")} 
                  style={{ width: 44, height: 44 }}
                  resizeMode="contain"
                />
                <View className="flex-1">
                  <Text className="text-[14px] font-lato-bold text-[#1F2937]">
                    {branchEarningSummary.channelPartnerCount} Channel Partner{Number(branchEarningSummary.channelPartnerCount) === 1 ? "" : "s"} earn upto{" "}
                    <Text className="text-[#11B980] font-lato-black">{branchEarningSummary.monthlyEarningLabel}</Text>
                  </Text>
                  <Text className="mt-0.5 text-[11px] font-lato-semibold text-gray-400">
                    {branchEarningSummary.branchName ? `In ${branchEarningSummary.branchName}` : "In Your Area"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Property Type Grid Section Container */}
          <View className="mb-6">
            <View className="mb-4">
              <Text className="text-[14px] text-gray-800 font-lato-bold tracking-wider uppercase">Property Type</Text>
            </View>

            <View className="flex-row gap-3 mb-4">
              {propertyCategories.map((category) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => handleCategoryPress(category.id)}
                    style={{ flex: 1, height: 105, overflow: 'hidden' }}
                    className={`border-2 rounded-2xl p-3 relative shadow-xs ${
                      isSelected 
                        ? 'bg-[#F5F3FF] border-[#7C3AED]' 
                        : 'bg-white border-[#E5E7EB]'
                    }`}
                  >
                    <Text 
                      className={`text-[15px] font-lato-bold ${isSelected ? 'text-[#7C3AED]' : 'text-[#1F2937]'}`}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      {category.label}
                    </Text>

                    {category.cloudImage && (
                      <Image
                        source={category.cloudImage}
                        style={{ position: 'absolute', top: 8, right: 12, width: 36, height: 18 }}
                        resizeMode="contain"
                      />
                    )}

                    <Image 
                      source={category.image} 
                      style={{ 
                        position: 'absolute', 
                        bottom: -8, 
                        right: -4, 
                        width: category.id === 'residential' ? 105 : 98, 
                        height: category.id === 'residential' ? 72 : 78,
                      }} 
                      resizeMode="contain" 
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* Nested Sub-categories grid rendering */}
            {selectedCategory && currentSubTypes.length > 0 && (
              <View className="flex-row flex-wrap justify-between mt-2">
                {currentSubTypes.map((subType) => {
                  const isSelected = selectedPropertyType === subType.id;
                  return (
                    <Pressable
                      key={subType.id}
                      onPress={() => handlePropertyTypePress(subType.id)}
                      style={{ 
                        width: (width - 48) / 4, 
                        height: 85, 
                        marginBottom: 12,
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                      className={`border-2 rounded-2xl p-2 shadow-xs ${
                        isSelected ? 'bg-[#F5F3FF] border-[#7C3AED]' : 'bg-white border-[#E5E7EB]'
                      }`}
                    >
                      <Text 
                        className={`text-[11px] font-lato-bold ${isSelected ? 'text-[#7C3AED]' : 'text-[#1F2937]'}`}
                        style={{ alignSelf: 'flex-start' }}
                        numberOfLines={1}
                      >
                        {subType.label}
                      </Text>
                      
                      <Image 
                        source={subType.image} 
                        style={{ 
                          position: 'absolute', 
                          bottom: -6, 
                          right: -2, 
                          width: 50, 
                          height: 50,
                        }} 
                        resizeMode="contain" 
                      />

                      {isSelected && shortlistedCount > 0 && (
                        <View style={{ position: 'absolute', top: 4, right: 4 }} className="bg-[#7C3AED] px-1.5 py-0.5 rounded-full">
                          <Text className="text-white text-[8px] font-lato-bold">{shortlistedCount}</Text>
                        </View>
                      )}
                      
                      {isSelected && shortlistedLoading && (
                        <View style={{ position: 'absolute', top: 4, right: 4 }}><Text className="text-[#7C3AED] text-[8px] font-lato-regular">...</Text></View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}