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
  Alert,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { 
  createRequirement, 
  updateRequirementApi, 
  setContactVerified,
  clearCustomerOtpState
} from "../../store/slices/requirementsSlice";
import { brokerPropertyApi } from "../../services/projectApi";
import LocationMapPicker from "../../components/LocationMapPicker";
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
  const existingReq = useMemo(
    () => (isEdit && Array.isArray(requirementsList) ? requirementsList.find(r => r.id.toString() === id.toString()) : null),
    [isEdit, requirementsList, id]
  );

  const [otp, setOtp] = useState("");
  const [customerOtp, setCustomerOtp] = useState({ token: "", verifiedToken: "", sending: false, verifying: false });
  const [locationMapVisible, setLocationMapVisible] = useState(false);

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

      const rawContact = existingReq.contact_number ? String(existingReq.contact_number).replace(/\D/g, "").slice(-10) : "";
      setForm({
        status: uiStatus,
        category: existingReq.property_type || "Plot",
        minArea: existingReq.min_area ? String(existingReq.min_area) : "",
        maxArea: existingReq.max_area ? String(existingReq.max_area) : "",
        unit: existingReq.area_unit || "Square Feet (Sq. ft)",
        name: existingReq.customer_name || "",
        contact: rawContact,
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

      setCustomerOtp({ token: "", verifiedToken: "existing", sending: false, verifying: false });
      dispatch(setContactVerified(true));
    } else {
      setCustomerOtp({ token: "", verifiedToken: "", sending: false, verifying: false });
      dispatch(setContactVerified(false));
      dispatch(clearCustomerOtpState());
    }
  }, [id, existingReq, dispatch, isEdit]);

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

  const sendCustomerOtp = async () => {
    const phone = form.contact.replace(/\D/g, "");
    if (phone.length !== 10) return Alert.alert("Invalid number", "Enter a valid 10-digit customer contact number.");
    setCustomerOtp(x => ({ ...x, sending: true, verifiedToken: "" }));
    try {
      const response = await brokerPropertyApi.sendCustomerOtp(`+91${phone}`);
      setCustomerOtp({ token: response.data?.otp_token || "", verifiedToken: "", sending: false, verifying: false });
      Alert.alert("OTP Sent", `An OTP has been sent to +91 ${phone}`);
    } catch (e) {
      setCustomerOtp(x => ({ ...x, sending: false }));
      Alert.alert("Could not send OTP", e.response?.data?.message || e.message || "Please try again.");
    }
  };

  const verifyCustomerOtp = async () => {
    if (!customerOtp.token) return Alert.alert("Send OTP first", "Request an OTP for the customer contact number.");
    if (otp.length !== 6) return Alert.alert("Invalid OTP", "Enter the 6-digit OTP.");
    setCustomerOtp(x => ({ ...x, verifying: true }));
    try {
      const response = await brokerPropertyApi.verifyCustomerOtp(customerOtp.token, otp);
      setCustomerOtp(x => ({ ...x, verifiedToken: response.data?.verified_token || "", verifying: false }));
      dispatch(setContactVerified(true));
      Alert.alert("Success", "Customer contact number verified successfully!");
    } catch (e) {
      setCustomerOtp(x => ({ ...x, verifying: false, verifiedToken: "" }));
      Alert.alert("Verification failed", e.response?.data?.message || e.message || "Please check the OTP.");
    }
  };

  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 10);
    setForm(prev => ({ ...prev, contact: cleaned }));
    setCustomerOtp({ token: "", verifiedToken: "", sending: false, verifying: false });
    setOtp("");
    dispatch(setContactVerified(false));
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
    if (!form.name.trim() || !form.contact.trim()) {
      Alert.alert("Details required", "Please enter customer name and contact number.");
      return;
    }

    const cleanContact = form.contact.replace(/\D/g, "");
    if (cleanContact.length !== 10) {
      Alert.alert("Invalid number", "Enter a valid 10-digit customer contact number.");
      return;
    }

    const isOriginalPhone = isEdit && existingReq && String(existingReq.contact_number || "").replace(/\D/g, "").slice(-10) === cleanContact;
    if (!isOriginalPhone && !customerOtp.verifiedToken) {
      Alert.alert("Verification required", "Verify the customer contact number with OTP.");
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
      ...(customerOtp.verifiedToken && customerOtp.verifiedToken !== "existing" ? { verified_token: customerOtp.verifiedToken } : {}),
      customer_name: form.name.trim(),
      contact_number: `+91${cleanContact}`,
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
        Alert.alert("Success", "Customer requirement updated successfully!");
      } else {
        const result = await dispatch(createRequirement(payload)).unwrap();
        Alert.alert("Success", "Customer requirement submitted successfully!");
        
        // Trigger notification after client submission
        await notifyClientSubmitted({
          clientId: result.id,
          clientReference: result.customer_name || form.name,
        });
      }
      router.back();
    } catch (err) {
      console.error('❌ [AddCustomerRequirement] Submission error:', err);
      Alert.alert("Could not submit", typeof err === "string" ? err : err?.message || "Please try again.");
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
            <Text className="text-sm font-lato-bold mb-2">Customer Contact No.</Text>
            <View className="min-h-[48px] border border-gray-300 rounded-lg flex-row items-center px-3 bg-white">
              <Text style={{ color: "#17171B", fontSize: 13, marginRight: 7, fontFamily: "Lato-Regular" }}>+91</Text>
              <TextInput
                placeholder="8120180101"
                placeholderTextColor="#8E8E96"
                keyboardType="phone-pad"
                maxLength={10}
                className="flex-1 text-sm font-lato-regular text-[#17171B] py-2"
                value={form.contact}
                onChangeText={handlePhoneChange}
                onFocus={() => handleFocus("contact")}
              />
              <Pressable disabled={customerOtp.sending} onPress={sendCustomerOtp}>
                <Text style={{ color: "#4A43EC", fontSize: 14, fontFamily: "Lato-Bold" }}>
                  {customerOtp.sending ? "Sending..." : customerOtp.token ? "Resend OTP" : "Send OTP"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Enter OTP */}
          <View className="mb-5" onLayout={(e) => handleFieldLayout("otp", e)}>
            <Text className="text-sm font-lato-bold mb-2">Enter OTP</Text>
            <View className="min-h-[48px] border border-gray-300 rounded-lg flex-row items-center px-3 bg-white">
              <TextInput
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#8E8E96"
                keyboardType="number-pad"
                maxLength={6}
                className="flex-1 text-sm font-lato-regular text-[#17171B] py-2"
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
                onFocus={() => handleFocus("otp")}
              />
              {customerOtp.verifiedToken ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="checkmark-circle" size={19} color="#16A34A" />
                  <Text style={{ color: "#16A34A", fontSize: 12, fontFamily: "Lato-Bold" }}>Verified</Text>
                </View>
              ) : (
                <Pressable disabled={customerOtp.verifying} onPress={verifyCustomerOtp}>
                  <Text style={{ color: "#4A43EC", fontSize: 13, fontFamily: "Lato-Bold" }}>
                    {customerOtp.verifying ? "Verifying..." : "Verify OTP"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Preferred Location */}
          <View className="mb-5" onLayout={(e) => handleFieldLayout("location", e)}>
            <Text className="text-sm font-lato-bold mb-2">Preferred Location</Text>
            <View className="min-h-[48px] border border-gray-300 rounded-lg flex-row items-center px-3 bg-white">
              <Ionicons name="location" size={18} color="#4A43EC" />
              <TextInput
                placeholder="Address & Landmark"
                placeholderTextColor="#8E8E96"
                className="flex-1 ml-2 text-sm font-lato-regular text-[#17171B] py-2"
                value={form.location}
                onChangeText={(text) => setForm((prev) => ({ ...prev, location: text }))}
                onFocus={() => handleFocus("location")}
              />
              <Pressable 
                onPress={() => { Keyboard.dismiss(); setLocationMapVisible(true); }} 
                hitSlop={12} 
                style={{ width: 30, height: 30, borderRadius: 7, backgroundColor: "#EEEDFD", alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="map-outline" size={18} color="#4A43EC" />
              </Pressable>
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

      {/* Location Map Picker Modal */}
      <LocationMapPicker 
        visible={locationMapVisible} 
        initialAddress={{ location: form.location }} 
        onClose={() => setLocationMapVisible(false)} 
        onConfirm={(address) => { 
          setForm((prev) => ({ 
            ...prev, 
            location: address.location || [address.city, address.state].filter(Boolean).join(", ") || prev.location 
          })); 
          setLocationMapVisible(false); 
        }} 
        confirmLabel="Add this location" 
      />
    </View>
  );
}
