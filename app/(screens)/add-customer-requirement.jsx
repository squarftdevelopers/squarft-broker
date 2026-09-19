import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StatusBar,
  Modal,
  FlatList,
  Dimensions,
  PanResponder,
  Platform,
  Keyboard,
  Image,
  ActivityIndicator,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { 
  createRequirement, 
  updateRequirementApi, 
  setContactVerified,
  sendCustomerOtp,
  verifyCustomerOtp,
  clearCustomerOtpState
} from "../../store/slices/requirementsSlice";
import { notifyClientSubmitted } from "../../utils/notificationHelpers";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PropertyRequirements = ["Buy", "Rent/Lease", "Paying Guest"];

const mainTypes = [
  {
    id: "Residential",
    label: "Residential",
    image: require("../../assets/icons/property-types/House2.png"),
    cloudImage: require("../../assets/icons/property-types/Clouds.png"),
  },
  {
    id: "Commercial",
    label: "Commercial",
    image: require("../../assets/icons/property-types/commercial.png"),
  },
];

const subTypesData = {
  Residential: [
    { id: "Plot", label: "Plot", image: require("../../assets/icons/property-types/plot.png") },
    { id: "Villa", label: "Villa", image: require("../../assets/icons/property-types/villa.png") },
    { id: "Apartment", label: "Apartment", image: require("../../assets/icons/property-types/apartment.png") },
    { id: "Rowhouse", label: "Rowhouse", image: require("../../assets/icons/property-types/rowhouse.png") },
  ],
  Commercial: [
    { id: "Shop", label: "Shop", image: require("../../assets/icons/property-types/Shop.png") },
    { id: "Showroom", label: "Showroom", image: require("../../assets/icons/property-types/showroom.png") },
    { id: "Office", label: "Office", image: require("../../assets/icons/property-types/office.png") },
  ]
};

const subTypeOptions = {
  Rowhouse: ["1bhk", "2bhk", "3bhk", "4bhk", "5+bhk"],
  Apartment: ["1bhk", "2bhk", "3bhk", "4bhk", "5+bhk"],
  Office: ["Ready to move", "Co-working", "Bare shell"],
};

const Units = [
  "Square Feet (Sq. ft)",
  "Square Meter (Sq. m)",
  "Square Yard (Sq. yd)",
  "Square Kilometer (Sq. km)",
  "Square Mile",
  "Acre",
  "Hectare",
  "Bigha",
  "Biswa",
  "Ghunta",
  "Cent",
  "Kanal",
  "Marla"
];

// Configuration for Slider
const MIN_VALUE = 100000;
const MAX_VALUE = 500000000;
const SLIDER_WIDTH = SCREEN_WIDTH - 40; // 20 padding on each side

export default function AddCustomerRequirement() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  const { id } = useLocalSearchParams();
  const isEdit = !!id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const requirementsList = useSelector((state) => state.requirements.list);
  const isContactVerified = useSelector((state) => state.requirements.isContactVerified);
  const customerOtpToken = useSelector((state) => state.requirements.customerOtpToken);
  const customerVerifiedToken = useSelector((state) => state.requirements.customerVerifiedToken);
  const otpLoading = useSelector((state) => state.requirements.otpLoading);
  const otpError = useSelector((state) => state.requirements.otpError);
  const existingReq = useMemo(
    () => (isEdit && Array.isArray(requirementsList) ? requirementsList.find(r => r.id.toString() === id.toString()) : null),
    [isEdit, requirementsList, id]
  );

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [propertyCategory, setPropertyCategory] = useState("Residential");
  const [form, setForm] = useState({
    status: "Buy",
    category: "Plot",
    minArea: "",
    maxArea: "",
    unit: "Square Feet (Sq. ft)",
    name: "",
    contact: "",
    location: "",
    budgetMin: MIN_VALUE,
    budgetMax: 10000000,
    details: "",
    rooms: "N/A",
  });

  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showSubTypeDropdown, setShowSubTypeDropdown] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [fieldOffsets, setFieldOffsets] = useState({});

  // Slider Logic
  const [sliderMin, setSliderMin] = useState(0); // 0 to 1 percentage
  const [sliderMax, setSliderMax] = useState(0.2); // 0 to 1 percentage

  useEffect(() => {
    if (isEdit && existingReq) {
      // Normalize requirement type for UI
      let uiStatus = "Buy";
      if (existingReq.requirement_type === "rent") {
        uiStatus = "Rent/Lease";
      } else if (existingReq.requirement_type === "paying_guest") {
        uiStatus = "Paying Guest";
      }

      // Try to determine category based on property_type
      let category = "Residential";
      if (["Shop", "Showroom", "Office"].includes(existingReq.property_type)) {
        category = "Commercial";
      }
      setPropertyCategory(category);
      // "sell" and "buy" both map back to "Buy"

      setForm({
        status: uiStatus,
        category: existingReq.property_type || "Plot",
        minArea: existingReq.min_area ? String(existingReq.min_area) : "",
        maxArea: existingReq.max_area ? String(existingReq.max_area) : "",
        unit: existingReq.area_unit || "Square Feet (Sq. ft)",
        name: existingReq.customer_name || "",
        contact: existingReq.contact_number || "",
        location: existingReq.preferred_locations?.[0] || "",
        budgetMin: existingReq.budget_min || MIN_VALUE,
        budgetMax: existingReq.budget_max || 10000000,
        details: existingReq.notes || "",
        rooms: "N/A",
      });

      const minPerc = ((existingReq.budget_min || MIN_VALUE) - MIN_VALUE) / (MAX_VALUE - MIN_VALUE);
      const maxPerc = ((existingReq.budget_max || 10000000) - MIN_VALUE) / (MAX_VALUE - MIN_VALUE);
      setSliderMin(Math.max(0, minPerc));
      setSliderMax(Math.min(1, maxPerc));

      dispatch(setContactVerified(true));
    } else {
      dispatch(setContactVerified(false));
      dispatch(clearCustomerOtpState());
    }
  }, [id, existingReq]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleFocus = (fieldKey) => {
    const y = fieldOffsets[fieldKey] ?? 0;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 50), animated: true });
    }, 100);
  };

  const handleFieldLayout = (fieldKey, event) => {
    const y = event?.nativeEvent?.layout?.y;
    if (typeof y === "number") {
      setFieldOffsets((prev) => ({ ...prev, [fieldKey]: y }));
    }
  };

  const panResponderMin = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        let newPos = (gestureState.moveX - 20) / SLIDER_WIDTH;
        if (newPos < 0) newPos = 0;
        if (newPos > sliderMax - 0.05) newPos = sliderMax - 0.05;
        setSliderMin(newPos);
        const actualVal = Math.round(MIN_VALUE + newPos * (MAX_VALUE - MIN_VALUE));
        setForm(prev => ({ ...prev, budgetMin: actualVal }));
      },
    })
  ).current;

  const panResponderMax = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        let newPos = (gestureState.moveX - 20) / SLIDER_WIDTH;
        if (newPos > 1) newPos = 1;
        if (newPos < sliderMin + 0.05) newPos = sliderMin + 0.05;
        setSliderMax(newPos);
        const actualVal = Math.round(MIN_VALUE + newPos * (MAX_VALUE - MIN_VALUE));
        setForm(prev => ({ ...prev, budgetMax: actualVal }));
      },
    })
  ).current;

  const handleSendOTP = async () => {
    if (!form.contact || form.contact.length < 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    console.log('🔔 [AddCustomerReq] Attempting to send OTP to:', form.contact);
    
    try {
      const result = await dispatch(sendCustomerOtp({ phone: form.contact })).unwrap();
      console.log('✅ [AddCustomerReq] OTP sent successfully:', result);
      setOtpSent(true);
      setCountdown(60); // Start 60 second countdown
      alert("OTP sent to " + form.contact);
    } catch (error) {
      console.error('❌ [AddCustomerReq] Failed to send OTP:', error);
      alert(error || "Failed to send OTP. Check console for details.");
    }
  };

  const handleOTPChange = async (text) => {
    setOtp(text);
    if (text.length === 6 && customerOtpToken) {
      try {
        await dispatch(verifyCustomerOtp({ otp_token: customerOtpToken, otp: text })).unwrap();
        Keyboard.dismiss();
        alert("Contact number verified successfully!");
      } catch (error) {
        alert(error || "Invalid OTP");
        setOtp("");
      }
    }
  };

  const handlePhoneChange = (text) => {
    setForm({ ...form, contact: text });
    if (isContactVerified || otpSent) {
      dispatch(clearCustomerOtpState());
      setOtpSent(false);
      setOtp("");
      setCountdown(0);
    }
  };

  const formatCurrency = (val) => {
    if (val >= 10000000) {
       return `₹ ${Math.floor(val/10000000)} Cr+`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val).replace('₹', '₹ ');
  };

  const handleSubmit = async () => {
    if (!form.name || !form.contact) {
      alert("Please enter customer name and contact number");
      return;
    }

    setIsSubmitting(true);

    // Normalize requirement type for backend
    let reqType = "buy";
    if (form.status === "Rent/Lease") {
      reqType = "rent";
    } else if (form.status === "Paying Guest") {
      reqType = "paying_guest";
    }

    const payload = {
      verified_token: customerVerifiedToken,
      customer_name: form.name.trim(),
      contact_number: form.contact.trim(),
      requirement_type: reqType,
      property_type: form.category,
      budget_min: form.budgetMin,
      budget_max: form.budgetMax,
      preferred_locations: form.location.trim() ? [form.location.trim()] : [],
      notes: form.details.trim() || null,
      min_area: form.minArea ? Number(form.minArea) : null,
      max_area: form.maxArea ? Number(form.maxArea) : null,
      area_unit: form.unit || null,
    };

    try {
      if (isEdit) {
        await dispatch(updateRequirementApi({ id, payload })).unwrap();
      } else {
        const result = await dispatch(createRequirement(payload)).unwrap();
        
        // ✅ Event #12: Trigger notification after client submission
        console.log('📋 [AddCustomerRequirement] Client submitted successfully, triggering notification');
        await notifyClientSubmitted({
          clientId: result.id,
          clientReference: result.customer_name || form.name,
        });
        console.log('✅ [AddCustomerRequirement] Client submission notification sent');
      }
      router.back();
    } catch (err) {
      console.error('❌ [AddCustomerRequirement] Submission error:', err);
      alert(err || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const Chip = ({ label, selected, onPress }) => (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full border mr-2 mb-2 ${
        selected ? "bg-[#EEEDFD] border-[#4A43EC]" : "bg-white border-gray-300"
      }`}
    >
      <Text className={`text-[12px] font-lato-bold ${selected ? "text-[#4A43EC]" : "text-gray-500"}`}>
        {label}
      </Text>
    </Pressable>
  );

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
          {isEdit ? "Edit Customer Requirement" : "Add Customer Requirement"}
        </Text>
      </View>

      <ScrollView 
        ref={scrollRef}
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 40 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-5">
          {/* Property Requirements */}
          <Text className="text-sm font-lato-bold mb-3">Property Requirements</Text>
          <View className="flex-row flex-wrap mb-5">
            {PropertyRequirements.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={form.status === item}
                onPress={() => setForm({ ...form, status: item })}
              />
            ))}
          </View>

          {/* Property Category */}
          <Text className="text-sm font-lato-bold mb-3">Property Category</Text>
          <View className="flex-row justify-between mb-8">
            {mainTypes.map((type) => (
              <Pressable
                key={type.id}
                onPress={() => {
                  setPropertyCategory(type.id);
                  setForm({ ...form, category: subTypesData[type.id][0].id });
                }}
                style={{ width: (SCREEN_WIDTH - 50) / 2 }}
                className={`bg-white rounded-xl h-28 border ${propertyCategory === type.id ? 'border-[#4A43EC] bg-[#EEEDFD]' : 'border-gray-100'
                  } shadow-sm relative overflow-hidden`}
              >
                <Text className="text-xs font-lato-bold text-black absolute top-2.5 left-2.5 z-10">{type.label}</Text>

                <View className="flex-1 justify-end items-end">
                  {type.cloudImage && (
                    <Image
                      source={type.cloudImage}
                      className="absolute top-0 right-3 w-20 h-14 opacity-60"
                      resizeMode="contain"
                    />
                  )}
                  <Image
                    source={type.image}
                    className="w-[80%] h-[70%] mt-auto"
                    resizeMode="contain"
                    style={{ marginBottom: -2, marginRight: -4 }}
                  />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Property Type */}
          <Text className="text-sm font-lato-bold mb-3">Property Type</Text>
          <View className="flex-row flex-wrap mb-6" style={{ gap: 12 }}>
            {(subTypesData[propertyCategory] || []).map((type) => (
              <Pressable
                key={type.id}
                onPress={() => {
                  setForm({ ...form, category: type.id, rooms: "N/A" });
                  setShowSubTypeDropdown(false);
                }}
                style={{ width: (SCREEN_WIDTH - 64) / 4 }}
                className={`bg-white rounded-lg h-20 border ${form.category === type.id ? 'border-[#4A43EC] bg-[#EEEDFD]' : 'border-gray-100'
                  } shadow-sm items-center overflow-hidden`}
              >
                <Text className={`text-[9px] font-lato-bold mt-1.5 mb-0.5 ${form.category === type.id ? 'text-[#4A43EC]' : 'text-black'}`} numberOfLines={1}>{type.label}</Text>
                <View className="flex-1 w-full justify-end">
                  <Image
                    source={type.image}
                    className="w-full h-[80%]"
                    resizeMode="contain"
                    style={{ marginBottom: -1 }}
                  />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Sub Type Dropdown (Configuration / Status) */}
          {form.category && subTypeOptions[form.category] && (
            <View className="mb-6">
              <Text className="text-sm font-lato-bold mb-3">Configuration / Status</Text>
              <Pressable
                onPress={() => setShowSubTypeDropdown(!showSubTypeDropdown)}
                className="flex-row items-center border border-gray-300 rounded-xl px-4 h-12 bg-white"
              >
                <Text className={`flex-1 text-sm font-lato-regular ${form.rooms !== "N/A" ? "text-black" : "text-gray-400"}`}>
                  {form.rooms !== "N/A" ? form.rooms : "Select option"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </Pressable>
              {showSubTypeDropdown && (
                <View
                  className="border border-gray-200 rounded-xl overflow-hidden bg-white mt-1 mb-1"
                  style={{ elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
                >
                  {subTypeOptions[form.category].map((option, i) => (
                    <Pressable
                      key={option}
                      onPress={() => { 
                        setForm({ ...form, rooms: option }); 
                        setShowSubTypeDropdown(false); 
                      }}
                      className={`px-4 py-3 ${i < subTypeOptions[form.category].length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <Text className="text-sm font-lato-regular text-gray-800">{option}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}


          {/* Area Requirement */}
          <Text className="text-sm font-lato-bold mb-3">Area Requirement</Text>
          <View 
            className="flex-row gap-3 mb-6"
            onLayout={(e) => handleFieldLayout("area", e)}
          >
            <View className="flex-1">
              <Text className="text-[11px] text-gray-500 mb-2">Min Area (Optional)</Text>
              <TextInput
                placeholder="null"
                className="bg-white border border-gray-300 rounded-lg px-3 h-12 text-sm font-lato-regular"
                value={form.minArea}
                onChangeText={(text) => setForm({ ...form, minArea: text })}
                onFocus={() => handleFocus("area")}
              />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] text-gray-500 mb-2">Max Area (Optional)</Text>
              <TextInput
                placeholder="2000"
                className="bg-white border border-gray-300 rounded-lg px-3 h-12 text-sm font-lato-regular"
                value={form.maxArea}
                onChangeText={(text) => setForm({ ...form, maxArea: text })}
                onFocus={() => handleFocus("area")}
              />
            </View>
          </View>

          {/* Unit Dropdown */}
          <Pressable onPress={() => setShowUnitPicker(true)} className="mb-6">
             <View className="absolute -top-2 left-3 bg-white px-1 z-10">
                <Text className="text-[10px] text-gray-500">Unit (Optional)</Text>
             </View>
             <View className="flex-row items-center justify-between border border-gray-300 rounded-lg px-3 h-12">
               <Text className="text-sm font-lato-regular">{form.unit}</Text>
               <Ionicons name="chevron-down" size={18} color="gray" />
             </View>
          </Pressable>

          {/* Customer Name */}
          <View className="mb-5" onLayout={(e) => handleFieldLayout("name", e)}>
            <Text className="text-sm font-lato-bold mb-2">Customer Name</Text>
            <TextInput
              placeholder="Enter customer name"
              className="bg-white border border-gray-300 rounded-lg px-3 h-12 text-sm font-lato-regular"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              onFocus={() => handleFocus("name")}
            />
          </View>

          {/* Contact Number */}
          <View className="mb-5" onLayout={(e) => handleFieldLayout("contact", e)}>
            <Text className="text-sm font-lato-bold mb-2">Contact Number</Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <TextInput
                  placeholder="Enter contact number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  className="bg-white border border-gray-300 rounded-lg px-3 h-12 text-sm font-lato-regular"
                  value={form.contact}
                  onChangeText={handlePhoneChange}
                  onFocus={() => handleFocus("contact")}
                  editable={!isContactVerified}
                />
              </View>
              
              {!isContactVerified && form.contact.length === 10 && !otpSent && (
                <Pressable 
                  onPress={handleSendOTP}
                  disabled={otpLoading}
                  className="bg-[#4A43EC] px-3 h-12 items-center justify-center rounded-lg min-w-[80px]"
                >
                  {otpLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white text-xs font-lato-bold">Send OTP</Text>
                  )}
                </Pressable>
              )}

              {isContactVerified && (
                <View className="bg-green-100 p-2 rounded-full">
                  <Ionicons name="checkmark-circle" size={20} color="green" />
                </View>
              )}
            </View>

            {/* OTP Input Row */}
            {otpSent && !isContactVerified && (
              <View className="flex-row items-center gap-2 mt-3">
                <View className="flex-1">
                  <TextInput
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    className="bg-white border border-gray-300 rounded-lg px-3 h-12 text-center text-sm font-lato-regular"
                    value={otp}
                    onChangeText={handleOTPChange}
                    editable={!otpLoading}
                  />
                </View>
                <Pressable 
                  onPress={handleSendOTP}
                  disabled={countdown > 0 || otpLoading}
                  className={`px-3 h-12 items-center justify-center rounded-lg min-w-[80px] ${
                    countdown > 0 || otpLoading ? 'bg-gray-300' : 'bg-[#4A43EC]/10'
                  }`}
                >
                  {otpLoading ? (
                    <ActivityIndicator color="#4A43EC" size="small" />
                  ) : (
                    <Text className={`text-xs font-lato-bold ${countdown > 0 ? 'text-gray-500' : 'text-[#4A43EC]'}`}>
                      {countdown > 0 ? `${countdown}s` : 'Resend'}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* Error Message */}
            {otpError && (
              <Text className="text-red-500 text-xs mt-1 font-lato-regular">{otpError}</Text>
            )}
          </View>

          {/* Preferred Location */}
          <View className="mb-5" onLayout={(e) => handleFieldLayout("location", e)}>
            <Text className="text-sm font-lato-bold mb-2">Preferred Location</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-3 h-12">
              <Ionicons name="location" size={18} color="#4A43EC" />
              <TextInput
                placeholder="Enter preferred location"
                className="flex-1 ml-2 text-sm font-lato-regular"
                value={form.location}
                onChangeText={(text) => setForm({ ...form, location: text })}
                onFocus={() => handleFocus("location")}
              />
            </View>
          </View>

          {/* Budget Range Slider */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-sm font-lato-bold">Budget Range</Text>
              <Text className="text-xs font-lato-bold text-[#4A43EC]">{formatCurrency(form.budgetMin)} - {formatCurrency(form.budgetMax)}</Text>
            </View>
            
            <View className="h-10 justify-center">
              <View className="h-1 bg-gray-200 w-full rounded-full">
                <View 
                   style={{ 
                     position: 'absolute', 
                     left: `${sliderMin * 100}%`, 
                     right: `${(1 - sliderMax) * 100}%`, 
                     height: '100%', 
                     backgroundColor: '#4A43EC' 
                   }} 
                />
                
                {/* Min Handle */}
                <View 
                  {...panResponderMin.panHandlers}
                  style={{ 
                    position: 'absolute', 
                    left: `${sliderMin * 100}%`, 
                    marginLeft: -10,
                    top: -8, 
                    width: 20, 
                    height: 20, 
                    borderRadius: 10, 
                    backgroundColor: '#4A43EC',
                    borderWidth: 2,
                    borderColor: 'white',
                    elevation: 5,
                    zIndex: 2,
                  }} 
                />
                
                {/* Max Handle */}
                <View 
                  {...panResponderMax.panHandlers}
                  style={{ 
                    position: 'absolute', 
                    left: `${sliderMax * 100}%`, 
                    marginLeft: -10,
                    top: -8, 
                    width: 20, 
                    height: 20, 
                    borderRadius: 10, 
                    backgroundColor: '#4A43EC',
                    borderWidth: 2,
                    borderColor: 'white',
                    elevation: 5,
                    zIndex: 2,
                  }} 
                />
              </View>
            </View>

            <View className="flex-row justify-between mt-1">
               <Text className="text-[10px] text-gray-500 font-lato-bold">₹ 1,00,000</Text>
               <Text className="text-[10px] text-gray-500 font-lato-bold">₹ 50,00,00,000+</Text>
            </View>
          </View>

          {/* Details */}
          <View className="mb-8" onLayout={(e) => handleFieldLayout("details", e)}>
            <Text className="text-sm font-lato-bold mb-2">Details</Text>
            <TextInput
              placeholder="Add property detail here..."
              multiline
              numberOfLines={4}
              className="bg-white border border-gray-300 rounded-lg px-3 py-3 h-24 text-sm font-lato-regular text-start"
              style={{ textAlignVertical: 'top' }}
              value={form.details}
              onChangeText={(text) => setForm({ ...form, details: text })}
              onFocus={() => handleFocus("details")}
            />
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={!form.name || !form.contact || isSubmitting}
            className={`py-3.5 rounded-full items-center justify-center shadow-lg ${
              !form.name || !form.contact || isSubmitting
                ? "bg-gray-300 shadow-gray-300/30" 
                : "bg-[#4A43EC] shadow-blue-500/30"
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className={`font-lato-bold text-sm ${!form.name || !form.contact ? "text-gray-500" : "text-white"}`}>
                {isEdit ? "Update" : "Submit"}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Unit Picker Modal */}
      <Modal visible={showUnitPicker} transparent animationType="fade">
        <Pressable 
          className="flex-1 bg-black/50 justify-center items-center" 
          onPress={() => setShowUnitPicker(false)}
        >
          <View className="bg-white w-[85%] max-h-[60%] rounded-2xl overflow-hidden">
            <View className="p-4 border-b border-gray-100 items-center">
              <Text className="text-base font-lato-bold">Select Unit</Text>
            </View>
            <FlatList
              data={Units}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable 
                  className="p-4 border-b border-gray-50"
                  onPress={() => {
                    setForm({ ...form, unit: item });
                    setShowUnitPicker(false);
                  }}
                >
                  <Text className={`text-sm ${form.unit === item ? 'text-[#4A43EC] font-lato-bold' : 'text-gray-700'}`}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
