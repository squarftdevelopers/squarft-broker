import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ZoomableImage from "./ZoomableImage";
import DynamicPropertyImage from "./DynamicPropertyImage";
import ImageLightbox from "../ImageLightbox";
import { formatTextValue, formatReraStatus, firstValue } from "../../utils/propertyHelpers";

const naksha = require("../../assets/images/building_naksha.png");

const { width } = Dimensions.get("window");

const AMENITY_ICONS = {
  Gymnasium: { icon: "dumbbell", color: "#0645A5" },
  "Swimming Pool": { icon: "pool", color: "#0645A5" },
  "24/7 Security": { icon: "shield-check-outline", color: "#0645A5" },
  "Power Backup": { icon: "lightning-bolt", color: "#0645A5" },
  Landscaping: { icon: "tree-outline", color: "#0645A5" },
  "Car Parking": { icon: "car-outline", color: "#0645A5" },
  Parking: { icon: "car-outline", color: "#0645A5" },
  "Sports Court": { icon: "tennis", color: "#0645A5" },
  "Wi-Fi Zone": { icon: "wifi", color: "#0645A5" },
  Clubhouse: { icon: "home-group", color: "#0645A5" },
  Garden: { icon: "flower-outline", color: "#0645A5" },
  Lift: { icon: "elevator", color: "#0645A5" },
  Elevator: { icon: "elevator", color: "#0645A5" },
  "Children Play Area": { icon: "toy-brick-outline", color: "#0645A5" },
  "Kids Play Area": { icon: "toy-brick-outline", color: "#0645A5" },
};

function getAmenityConfig(label) {
  if (!label) return { icon: "star-outline", color: "#0645A5" };
  const direct = AMENITY_ICONS[label];
  if (direct) return direct;

  const lower = String(label).toLowerCase().trim();
  if (lower.includes("swim") || lower.includes("pool")) return { icon: "pool", color: "#0645A5" };
  if (lower.includes("gym") || lower.includes("fitness")) return { icon: "dumbbell", color: "#0645A5" };
  if (lower.includes("secur") || lower.includes("guard") || lower.includes("cctv")) return { icon: "shield-check-outline", color: "#0645A5" };
  if (lower.includes("park") || lower.includes("car")) return { icon: "car-outline", color: "#0645A5" };
  if (lower.includes("power") || lower.includes("backup") || lower.includes("generator")) return { icon: "lightning-bolt", color: "#0645A5" };
  if (lower.includes("garden") || lower.includes("plant") || lower.includes("flower")) return { icon: "flower-outline", color: "#0645A5" };
  if (lower.includes("club")) return { icon: "home-group", color: "#0645A5" };
  if (lower.includes("lift") || lower.includes("elevator")) return { icon: "elevator", color: "#0645A5" };
  if (lower.includes("play") || lower.includes("kid") || lower.includes("child")) return { icon: "toy-brick-outline", color: "#0645A5" };
  if (lower.includes("wifi") || lower.includes("wi-fi") || lower.includes("internet")) return { icon: "wifi", color: "#0645A5" };
  if (lower.includes("court") || lower.includes("sport") || lower.includes("tennis")) return { icon: "tennis", color: "#0645A5" };
  if (lower.includes("landscap") || lower.includes("tree")) return { icon: "tree-outline", color: "#0645A5" };

  return { icon: "star-outline", color: "#0645A5" };
}

function AmenityItem({ label }) {
  const config = getAmenityConfig(label);
  return (
    <View className="flex-row items-center gap-2.5 w-[50%] mb-3.5 pr-2">
      <View className="w-10 h-10 rounded-[12px] bg-[#F1F3FF] items-center justify-center">
        <MaterialCommunityIcons
          name={config.icon}
          size={20}
          color={config.color || "#0645A5"}
        />
      </View>
      <Text
        numberOfLines={2}
        className="text-[13px] font-manrope-medium text-[#0B2855] flex-1 leading-[17px]"
      >
        {label}
      </Text>
    </View>
  );
}

const normalizeAmenities = (item) => {
  const raw = firstValue(item, [
    "amenities",
    "world_class_amenities",
    "worldClassAmenities",
    "admin_amenities",
  ]);

  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((amenity) => {
        if (typeof amenity === "string") return amenity;
        return amenity?.name || amenity?.label || amenity?.title || amenity?.amenity_name;
      })
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return normalizeAmenities({ amenities: parsed });
    } catch {
      // Plain comma-separated amenities are also supported.
    }

    return raw.split(",").map((amenity) => amenity.trim()).filter(Boolean);
  }

  return [];
};

const getInitials = (name) => {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "--";
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
};

const DEAL_STAGES = [
  { key: 'deal_created',      label: 'Deal Created',       icon: 'handshake-outline' },
  { key: 'meetings_notes',    label: 'Meetings & Notes',   icon: 'text-box-outline' },
  { key: 'token',             label: 'Token Amount',       icon: 'cash-check' },
  { key: 'payment_schedule',  label: 'Payment Schedule',   icon: 'calendar-check-outline' },
  { key: 'payment_history',   label: 'Payment History',    icon: 'receipt' },
  { key: 'documents',         label: 'Documents',          icon: 'file-document-outline' },
  { key: 'timeline',          label: 'Timeline',           icon: 'timeline-clock-outline' },
];

const getFollowUpStyles = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("cancel")) return { statusColor: "#B42318", statusBg: "#FFF1EF" };
  if (normalized.includes("paid") || normalized.includes("complet")) return { statusColor: "#027A48", statusBg: "#ECFDF3" };
  if (normalized.includes("pending") || normalized.includes("visit")) return { statusColor: "#B54708", statusBg: "#FFFAEB" };
  return { statusColor: "#4A43EC", statusBg: "#F1F3FF" };
};

const normalizeFollowUps = (item) => {
  const raw = firstValue(item, ["follow_ups"]);
  if (!Array.isArray(raw)) return [];

  return raw.map((followUp, index) => {
    const customerName = followUp.customer_name || "Customer";
    const salesOfficer = followUp.sales_officer || "Unassigned";
    const status = followUp.status || "Follow Up";
    const styles = getFollowUpStyles(status);
    const stageIndex = typeof followUp.current_stage_index === 'number'
      ? followUp.current_stage_index
      : 0;

    return {
      id: followUp.id || String(index),
      status,
      statusColor: styles.statusColor,
      statusBg: styles.statusBg,
      unit: followUp.unit || "Unit not set",
      customerName,
      nextEvent: followUp.next_event || null,
      salesOfficer,
      officerInitials: getInitials(salesOfficer),
      currentStageIndex: stageIndex,
      dealValue: followUp.deal_value || null,
      bookingDate: followUp.booking_date || null,
    };
  });
};

const normalizeVisits = (item) => {
  const raw = item?.property_visits;
  if (!Array.isArray(raw)) return [];

  return raw.map((v, i) => {
    const slotStart = v.slot_start ? new Date(v.slot_start) : null;
    const now = new Date();
    const isUpcoming = slotStart ? slotStart > now : false;
    const status = String(v.status || '').toLowerCase();
    let statusLabel = v.status || 'Scheduled';
    let statusColor = '#4A43EC';
    let statusBg = '#F1F3FF';
    if (status === 'completed') { statusColor = '#027A48'; statusBg = '#ECFDF3'; statusLabel = 'Completed'; }
    else if (status === 'cancelled') { statusColor = '#B42318'; statusBg = '#FFF1EF'; statusLabel = 'Cancelled'; }
    else if (status === 'confirmed') { statusColor = '#027A48'; statusBg = '#ECFDF3'; statusLabel = 'Confirmed'; }
    else if (status === 'pending') { statusColor = '#B54708'; statusBg = '#FFFAEB'; statusLabel = 'Pending'; }
    else if (status === 'rescheduled') { statusColor = '#6941C6'; statusBg = '#F9F5FF'; statusLabel = 'Rescheduled'; }

    const formatSlot = (d) => {
      if (!d) return null;
      const date = new Date(d);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' · ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return {
      id: v.id || String(i),
      isUpcoming,
      statusLabel,
      statusColor,
      statusBg,
      customerName: v.customer_name || 'Customer',
      customerPhone: v.customer_phone || null,
      salesOfficer: v.sales_officer || 'Unassigned',
      officerInitials: getInitials(v.sales_officer),
      slotDisplay: formatSlot(v.slot_start),
      leadTemperature: v.lead_temperature || null,
      note: v.officer_note || v.user_note || null,
    };
  });
};

export default function PropertyDetailSheet({
  visible,
  onClose,
  item,
  loading = false,
  error = null,
}) {
  const bottomSheetModalRef = useRef(null);
  const insets = useSafeAreaInsets();
  // A listing without project amenities has substantially less content. Keep the
  // sheet compact in that case while retaining a scrollable body and fixed tabs.
  const compactSheet = Boolean(item) && !loading && normalizeAmenities(item).length === 0;
  const snapPoints = useMemo(() => [compactSheet ? "78%" : "99%"], [compactSheet]);
  
  const floorPlanVisible = false;
  const [zoomVisible, setZoomVisible] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("detail"); 

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setActiveTab("detail");
    }
  }, [visible, item?.id]);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
      />
    ),
    []
  );

  if (!item) return null;

  const amenitiesList = normalizeAmenities(item);
  const followUps = normalizeFollowUps(item);
  const visits = normalizeVisits(item);
  const upcomingVisits = visits.filter(v => v.isUpcoming && v.statusLabel !== 'Cancelled' && v.statusLabel !== 'Completed');
  const pastVisits = visits.filter(v => !v.isUpcoming || v.statusLabel === 'Completed' || v.statusLabel === 'Cancelled');

  // Get category to determine if residential or commercial
  const category = String(firstValue(item, ["category", "type", "property_category"]) || "").toLowerCase();
  const isResidential = category.includes("residential");
  
  const propertySubType = formatTextValue(firstValue(item, ["sub_type", "property_subtype"]));

  const getPropertySubtype = () => {
    // 🔍 DEBUG: Log what data we're working with
    console.log('🏠 [PropertyDetailSheet] getPropertySubtype DEBUG:', {
      isResidential,
      bedrooms: item?.bedrooms,
      kind_of_property: item?.kind_of_property,
      property_subtype: item?.property_subtype,
      sub_type: item?.sub_type,
      item_keys: Object.keys(item || {})
    });
    
    if (isResidential) {
      const description = firstValue(item, ["description"]);
      if (String(description || "").toLowerCase().includes("bhk")) {
        return [propertySubType, formatTextValue(description)].filter(Boolean).join(" · ");
      }

      // Legacy fallback for properties created before BHK moved to description.
      const bedroomsCount = firstValue(item, ["bedrooms"]);
      
      console.log('🔍 [PropertyDetailSheet] bedroomsCount from firstValue:', bedroomsCount);
      
      if (bedroomsCount && !isNaN(bedroomsCount)) {
        const num = parseInt(bedroomsCount);
        const result = num >= 5 ? "5+ BHK" : `${num} BHK`;
        console.log('✅ [PropertyDetailSheet] Returning BHK from bedrooms:', result);
        return [propertySubType, result].filter(Boolean).join(" · ");
      }
      
      // Fallback: Check legacy kind_of_property field for backward compatibility
      const bhkType = firstValue(item, [
        "kind_of_property",
      
      ]);
      
      console.log('🔍 [PropertyDetailSheet] bhkType from kind_of_property:', bhkType);
      
      if (bhkType) {
        const bhkStr = String(bhkType).toLowerCase();
        // If already formatted as "3_bhk" or "3 bhk"
        if (bhkStr.includes("bhk")) {
          return [propertySubType, formatTextValue(bhkType)].filter(Boolean).join(" · ");
        }
        // If it's just a number like "3" or 3
        const num = parseInt(bhkType);
        if (!isNaN(num)) {
          const legacyBhk = num >= 5 ? "5+ BHK" : `${num} BHK`;
          return [propertySubType, legacyBhk].filter(Boolean).join(" · ");
        }
      }
    } 
    
    // For commercial or if BHK not found, show property type/subtype
    const fallback = propertySubType;
    console.log('🔍 [PropertyDetailSheet] Returning fallback property_subtype:', fallback);
    return fallback;
  };
  
  const propertySubtype = getPropertySubtype();
  
  const reraStatus = formatReraStatus(firstValue(item, [
    "approval_status",      // Primary field - the actual approval status from DB
    "rera_approval_status",
    "rera_status",
  ]));
  const views = firstValue(item, [
    "views",
    "view_count",
  ]);
  const totalArea = firstValue(item, [
    "total_area_sqft",
  ]);

  // Handle different price formats from API - show exact price without conversion or units
  const getFormattedPrice = () => {
    const rawPrice = item.selling_price ?? item.price ?? item.base_price ?? item.price_from ?? item.min_price;
    const priceFrom = item.price_from || item.min_price;
    const priceTo = item.price_to || item.max_price;

    const formatExact = (val) => {
      if (val === undefined || val === null || val === "") return "";
      const cleaned = String(val).replace(/[^\d.]/g, "").trim();
      const num = Number(cleaned);
      if (Number.isFinite(num) && num > 0) {
        return `\u20B9${num.toLocaleString("en-IN")}`;
      }
      return cleaned ? `\u20B9${cleaned}` : "";
    };

    if (priceFrom && priceTo && Number(String(priceTo).replace(/[^\d.]/g, "")) > Number(String(priceFrom).replace(/[^\d.]/g, ""))) {
      return `${formatExact(priceFrom)} - ${formatExact(priceTo)}`;
    }

    if (rawPrice !== undefined && rawPrice !== null && rawPrice !== "" && rawPrice !== 0 && rawPrice !== "0") {
      return formatExact(rawPrice);
    }

    return "Price on request";
  };

  const priceFormatted = getFormattedPrice();

  const propertyImages = (Array.isArray(item.media) ? item.media : [])
    .filter((media) => media.media_type === "image" && media.url)
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || Number(a.sort_order || 0) - Number(b.sort_order || 0));
  const primaryImage = propertyImages[0]?.url || item.cover_image_url || (typeof item.image === "string" ? item.image : null);
  const secondaryImage = propertyImages[1]?.url || null;
  const locationLabel = [item.address, item.city, item.state, item.pincode].filter(Boolean).join(", ");
  return (
    <>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        onDismiss={onClose}
        backdropComponent={renderBackdrop}
        handleComponent={() => (
          <View className="items-center pt-4 pb-6">
            <View className="w-20 h-1.5 bg-gray-300 rounded-full" />
          </View>
        )}
        backgroundStyle={{ borderRadius: 28 }}
      >
        <View style={{ flex: 1 }}>
          {activeTab === "followup" && (
            <View className="items-center py-3 ">
              <Text className="text-[16px] font-manrope-bold text-[#0F172A] mb-6">Follow Up</Text>
            </View>
          )}

          {activeTab === "detail" ? (
            <BottomSheetScrollView
              showsVerticalScrollIndicator={false}
              className="mx-5 mb-2"
              contentContainerStyle={{ paddingBottom: 108 + insets.bottom }}
            >
              {error ? (
                <View className="mx-4 mt-4 rounded-2xl bg-[#FFF1EF] border border-[#FFD7CF] px-4 py-3">
                  <Text className="text-[12px] font-manrope-bold text-[#B42318]">Could not load latest details</Text>
                  <Text className="text-[11px] font-manrope-medium text-[#B42318] mt-1">{error}</Text>
                </View>
              ) : null}

              {/* Hero Image Section */}
              <TouchableOpacity activeOpacity={0.94} disabled={!primaryImage} onPress={() => setGalleryVisible(true)} style={{ height: 145, overflow: "hidden" }}>
                <View style={{ flex: 1, flexDirection: "row" }}>
                  <DynamicPropertyImage uri={primaryImage} style={{ flex: 1.4, height: 145 }} label="No image uploaded" />
                  <View style={{ width: 2, backgroundColor: "#fff" }} />
                  <View style={{ flex: 1, height: 145, position: "relative" }}>
                    <DynamicPropertyImage uri={secondaryImage || primaryImage} style={{ width: "100%", height: "100%" }} imageStyle={{ opacity: 0.9 }} label="No image" />
                    <View
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{propertyImages.length || (primaryImage ? 1 : 0)} photos</Text>
                    </View>
                  </View>
                </View>

                {/* Verified Badge */}
                <View
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#fff",
                    borderRadius: 30,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    gap: 3,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <MaterialCommunityIcons name="check-decagram" size={16} color="#0052CC" />
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#0052CC", letterSpacing: 0.2 }}>SQUARFT VERIFIED</Text>
                </View>

                <TouchableOpacity
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    borderRadius: 20,
                    padding: 6,
                  }}
                >
            
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Header Details */}
              <View className="flex-row items-center gap-5 mx-5 mt-3 mb-3.5">
                <Text className="text-[12px] font-manrope-regular text-gray-500" numberOfLines={1}>{locationLabel || "Location not provided"}</Text>
                <Text className="text-[12px] font-manrope-regular text-gray-500">• Status: {item.status || "Active"}</Text>
              </View>

              <View style={{ marginHorizontal: 20, marginBottom: 9, borderBottomWidth: 1, borderBottomColor: "#D1D5DB", borderStyle: "dashed" }} />

              {/* BHK & Price */}
              <View className="mx-5 mb-2">
                <View className="flex-row items-center justify-between mb-2">
                  <View>
                    <Text className="text-[12px] font-manrope-bold text-gray-500 uppercase">{propertySubtype || item.category || "Property"}</Text>
                    <Text className="text-[16px] font-manrope-extrabold text-[#0F172A]">{item.title || item.name || 'Property'}</Text>
                    <Text className="text-[15px] font-manrope-bold text-[#4A43EC] mt-0.5">{priceFormatted}</Text>
                  </View>
              
                </View>

                {floorPlanVisible && (
                  <View className="mt-2 rounded-2xl overflow-hidden bg-[#F8FAFC] items-center py-5" style={{ borderWidth: 1, borderColor: "#E0E8FF" }}>
                    <TouchableOpacity onPress={() => setZoomVisible(true)} activeOpacity={0.85}>
                      <Image source={naksha} style={{ width: width * 0.75, height: 200 }} resizeMode="contain" />
                      <View style={{ position: "absolute", bottom: 6, right: 6, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 12, padding: 5 }}>
                        <MaterialCommunityIcons name="magnify-plus-outline" size={16} color="#fff" />
                      </View>
                    </TouchableOpacity>
                    <Text className="text-[11px] font-manrope-regular text-gray-400 mt-2">{propertySubtype} · {item.areaSqft || item.area} sq.ft.</Text>
                  </View>
                )}
              </View>

              {/* Stats Grid */}
              <View className="flex-row flex-wrap mx-4 justify-between mb-3 mt-4">
                {[
                  { label: "AREA", value: totalArea ? `${totalArea} sqft` : "N/A" },
                  { label: "PROPERTY SUB-TYPE", value: propertySubtype },
                  { label: "RERA STATUS", value: reraStatus },
                  { label: "VIEWS", value: views ?? "0" },
                ].map((stat) => (
                  <View
                    key={stat.label}
                    className="bg-[#F1F3FF] border border-[#E0E8FF] rounded-2xl p-4 py-4 mb-4"
                    style={{ width: (width - 68) / 2 - 6 }}
                  >
                    <Text className="text-[10px] font-manrope-bold text-gray-400 tracking-widest">{stat.label}</Text>
                    <Text className="text-[16px] font-manrope-bold text-[#041B3C]">{stat.value}</Text>
                  </View>
                ))}
              </View>

              {/* Amenities Section */}
              {!loading && amenitiesList.length > 0 ? (
              <View className="mx-4 bg-white border border-[#E0E8FF] rounded-2xl p-4 px-4.5 mb-3">
                <Text className="text-[15px] font-manrope-bold text-[#0B2855] mb-3.5">World-Class Amenities</Text>
                <View className="flex-row flex-wrap">
                  {amenitiesList.map((a, i) => (
                    <AmenityItem key={`${a}-${i}`} label={a} />
                  ))}
                </View>
              </View>
              ) : null}
            </BottomSheetScrollView>
          ) : (
            <BottomSheetScrollView
              showsVerticalScrollIndicator={false}
              className="mx-5 mb-5"
              contentContainerStyle={{ paddingBottom: 108 + insets.bottom }}
            >
              {error ? (
                <View className="py-10 items-center px-6">
                  <Feather name="alert-circle" size={34} color="#FE8A71" />
                  <Text className="text-[13px] font-manrope-bold text-[#B42318] mt-3 text-center">Could not load follow ups</Text>
                  <Text className="text-[11px] font-manrope-medium text-[#B42318] mt-1 text-center">{error}</Text>
                </View>
              ) : loading ? (
                <View className="py-10 items-center">
                  <ActivityIndicator size="small" color="#4A43EC" />
                  <Text className="text-[12px] font-manrope-medium text-gray-400 mt-3">Loading...</Text>
                </View>
              ) : (
                <>
                  {/* ── Visits Section ── */}
                  {visits.length > 0 && (
                    <View className="mb-4">
                      <Text className="text-[12px] font-manrope-bold text-gray-400 uppercase tracking-widest mb-2.5">Site Visits</Text>

                      {upcomingVisits.length > 0 && (
                        <View className="mb-3">
                          <Text className="text-[10px] font-manrope-bold text-[#027A48] uppercase mb-2">📅 Upcoming</Text>
                          {upcomingVisits.map(v => (
                            <View key={v.id} className="bg-white border border-[#D1FAE5] rounded-[16px] p-4 mb-2.5" style={{ elevation: 1, shadowColor: '#027A48', shadowOpacity: 0.05, shadowRadius: 4 }}>
                              <View className="flex-row items-center justify-between mb-2">
                                <View className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: v.statusBg }}>
                                  <Text className="text-[9px] font-manrope-bold" style={{ color: v.statusColor }}>{v.statusLabel}</Text>
                                </View>
                                {v.leadTemperature === 'hot' && (
                                  <Text className="text-[9px] font-manrope-bold text-[#B42318]">🔥 Hot Lead</Text>
                                )}
                              </View>
                              <Text className="text-[14px] font-manrope-extrabold text-[#0F172A]">{v.customerName}</Text>
                              {v.slotDisplay && (
                                <View className="flex-row items-center gap-1.5 mt-1">
                                  <MaterialCommunityIcons name="clock-outline" size={12} color="#64748B" />
                                  <Text className="text-[11px] font-manrope-medium text-gray-500">{v.slotDisplay}</Text>
                                </View>
                              )}
                              <View className="h-[1px] bg-gray-100 w-full my-2.5" />
                              <View className="flex-row items-center gap-2">
                                <View className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center border border-gray-300">
                                  <Text className="text-[9px] font-manrope-bold text-gray-700">{v.officerInitials}</Text>
                                </View>
                                <Text className="text-[11px] font-manrope-medium text-gray-600">{v.salesOfficer}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {pastVisits.length > 0 && (
                        <View className="mb-3">
                          <Text className="text-[10px] font-manrope-bold text-gray-400 uppercase mb-2">🕐 Past Visits</Text>
                          {pastVisits.map(v => (
                            <View key={v.id} className="bg-white border border-gray-100 rounded-[16px] p-4 mb-2.5" style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3 }}>
                              <View className="flex-row items-center justify-between mb-2">
                                <View className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: v.statusBg }}>
                                  <Text className="text-[9px] font-manrope-bold" style={{ color: v.statusColor }}>{v.statusLabel}</Text>
                                </View>
                                {v.leadTemperature === 'hot' && (
                                  <Text className="text-[9px] font-manrope-bold text-[#B42318]">🔥 Hot</Text>
                                )}
                              </View>
                              <Text className="text-[14px] font-manrope-extrabold text-[#0F172A]">{v.customerName}</Text>
                              {v.slotDisplay && (
                                <View className="flex-row items-center gap-1.5 mt-1">
                                  <MaterialCommunityIcons name="clock-outline" size={12} color="#94A3B8" />
                                  <Text className="text-[11px] font-manrope-medium text-gray-400">{v.slotDisplay}</Text>
                                </View>
                              )}
                              {v.note && (
                                <Text className="text-[11px] font-manrope-regular text-gray-400 mt-1.5 italic">{v.note}</Text>
                              )}
                              <View className="h-[1px] bg-gray-100 w-full my-2.5" />
                              <View className="flex-row items-center gap-2">
                                <View className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center border border-gray-300">
                                  <Text className="text-[9px] font-manrope-bold text-gray-700">{v.officerInitials}</Text>
                                </View>
                                <Text className="text-[11px] font-manrope-medium text-gray-600">{v.salesOfficer}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* ── Deal Stages Section ── */}
                  {followUps.length > 0 ? (
                    <View>
                      <Text className="text-[12px] font-manrope-bold text-gray-400 uppercase tracking-widest mb-2.5">Active Deals</Text>
                      {followUps.map(f => (
                        <View key={f.id} className="bg-white border border-gray-100 rounded-[18px] mb-4" style={{ elevation: 2, shadowColor: '#101828', shadowOpacity: 0.06, shadowRadius: 6, overflow: 'hidden' }}>
                          {/* Deal header */}
                          <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
                            <View className="flex-1 mr-2">
                              <Text className="text-[15px] font-manrope-extrabold text-[#0F172A]">{f.customerName}</Text>
                              {f.nextEvent && (
                                <Text className="text-[11px] font-manrope-medium text-gray-500 mt-0.5">{f.nextEvent}</Text>
                              )}
                            </View>
                            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: f.statusBg }}>
                              <Text className="text-[9px] font-manrope-bold" style={{ color: f.statusColor }}>{f.status}</Text>
                            </View>
                          </View>

                          <View className="h-[1px] bg-gray-100 mx-4" />

                          {/* Deal stage progress cards */}
                          <View className="px-4 pt-3 pb-4 gap-2">
                            {DEAL_STAGES.map((stage, idx) => {
                              const isDone = idx < f.currentStageIndex;
                              const isCurrent = idx === f.currentStageIndex;
                              return (
                                <View
                                  key={stage.key}
                                  className="flex-row items-center gap-3 rounded-[12px] px-3 py-2.5"
                                  style={{
                                    backgroundColor: isCurrent ? '#F1F3FF' : isDone ? '#F8FAF8' : '#FAFAFA',
                                    borderWidth: 1,
                                    borderColor: isCurrent ? '#C7C4F8' : isDone ? '#D1FAE5' : '#F1F5F9',
                                  }}
                                >
                                  <View
                                    className="w-7 h-7 rounded-full items-center justify-center"
                                    style={{ backgroundColor: isCurrent ? '#4A43EC' : isDone ? '#027A48' : '#E2E8F0' }}
                                  >
                                    {isDone ? (
                                      <MaterialCommunityIcons name="check" size={14} color="#fff" />
                                    ) : (
                                      <MaterialCommunityIcons name={stage.icon} size={13} color={isCurrent ? '#fff' : '#94A3B8'} />
                                    )}
                                  </View>
                                  <Text
                                    className="text-[12px] flex-1"
                                    style={{
                                      fontFamily: isCurrent ? 'Manrope-Bold' : isDone ? 'Manrope-SemiBold' : 'Manrope-Regular',
                                      color: isCurrent ? '#4A43EC' : isDone ? '#027A48' : '#94A3B8',
                                    }}
                                  >
                                    {stage.label}
                                  </Text>
                                  {isCurrent && (
                                    <View className="px-2 py-0.5 rounded-full bg-[#4A43EC]">
                                      <Text className="text-[8px] font-manrope-bold text-white">CURRENT</Text>
                                    </View>
                                  )}
                                  {isDone && (
                                    <MaterialCommunityIcons name="check-circle" size={14} color="#027A48" />
                                  )}
                                </View>
                              );
                            })}
                          </View>

                          {/* Sales officer footer */}
                          <View className="border-t border-gray-100 mx-4 pt-2.5 pb-4">
                            <Text className="text-[9px] font-manrope-bold text-gray-400 uppercase mb-1.5">Sales Officer</Text>
                            <View className="flex-row items-center gap-2.5">
                              <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center border border-gray-300">
                                <Text className="text-[10px] font-manrope-bold text-gray-800">{f.officerInitials}</Text>
                              </View>
                              <Text className="text-[12px] font-manrope-bold text-[#333]">{f.salesOfficer}</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : visits.length === 0 ? (
                    <View className="py-10 items-center px-6">
                      <Feather name="clipboard" size={34} color="#CBD5E1" />
                      <Text className="text-[13px] font-manrope-bold text-[#64748B] mt-3 text-center">No activity yet</Text>
                      <Text className="text-[11px] font-manrope-medium text-gray-400 mt-1 text-center">
                        Visits and deals for this property will appear here.
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </BottomSheetScrollView>
          )}

          {/* Footer Tabs */}
          <View className="px-5 pt-3 flex-row gap-3 border-t border-gray-100 bg-white" style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingBottom: Math.max(insets.bottom, 16), elevation: 8, shadowColor: "#101828", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: -3 } }}>
            <TouchableOpacity
              onPress={() => setActiveTab("detail")}
              className="flex-1 rounded-2xl py-4 items-center justify-center"
              style={{ 
                backgroundColor: activeTab === "detail" ? "#4A43EC" : "#fff", 
                borderWidth: 1, 
                borderColor: activeTab === "detail" ? "#4A43EC" : "#E2E8F0" 
              }}
            >
              <Text className="text-[14px] font-manrope-bold" style={{ color: activeTab === "detail" ? "#fff" : "#4A43EC" }}>Property Detail</Text>
            </TouchableOpacity>
       <TouchableOpacity
              onPress={() => setActiveTab("followup")}
              className="flex-1 rounded-2xl py-4 items-center justify-center"
              style={{ 
                backgroundColor: activeTab === "followup" ? "#4A43EC" : "#fff", 
                borderWidth: 1, 
                borderColor: activeTab === "followup" ? "#4A43EC" : "#E2E8F0" 
              }}
            >
              <Text className="text-[14px] font-manrope-bold" style={{ color: activeTab === "followup" ? "#fff" : "#4A43EC" }}>Follow Ups</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetModal>

      <ZoomableImage
        visible={zoomVisible}
        onClose={() => setZoomVisible(false)}
        source={naksha}
      />
      <ImageLightbox
        visible={galleryVisible}
        images={propertyImages.length > 0 ? propertyImages.map((media) => media.url) : (primaryImage ? [primaryImage] : [])}
        onClose={() => setGalleryVisible(false)}
      />
    </>
  );
}
