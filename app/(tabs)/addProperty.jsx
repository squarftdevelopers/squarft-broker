import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Keyboard, Modal, Platform, Pressable, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { brokerPropertyApi } from "../../services/projectApi";
import LocationMapPicker from "../../components/LocationMapPicker";

const PURPLE = "#4B42F5";
const mainTypes = [
  { id: "residential", label: "Residential", image: require("../../assets/icons/property-types/House2.png") },
  { id: "commercial", label: "Commercial", image: require("../../assets/icons/property-types/commercial.png") },
];
const subTypes = {
  residential: [
    { id: "plot", label: "Plot", image: require("../../assets/icons/property-types/plot.png") },
    { id: "villa", label: "Villa", image: require("../../assets/icons/property-types/villa.png") },
    { id: "apartment", label: "Apartment", image: require("../../assets/icons/property-types/apartment.png") },
    { id: "rowhouse", label: "Rowhouse", image: require("../../assets/icons/property-types/rowhouse.png") },
  ],
  commercial: [
    { id: "shop", label: "Shop", image: require("../../assets/icons/property-types/Shop.png") },
    { id: "showroom", label: "Showroom", image: require("../../assets/icons/property-types/showroom.png") },
    { id: "office", label: "Office", image: require("../../assets/icons/property-types/office.png") },
  ],
};
const kindOptions = {
  apartment: ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK", "5+ BHK"],
  villa: ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK", "5+ BHK"],
  rowhouse: ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK", "5+ BHK"],
  office: ["Ready To Move", "Bare Shell", "Co-Working"],
  shop: ["Ready To Move", "Bare Shell"],
  showroom: ["Ready To Move", "Bare Shell"],
  plot: ["Residential Plot", "Commercial Plot", "Agricultural Plot"],
};
const areaUnits = ["Square Feet (sq ft)", "Square Meter (sq m)", "Acre", "Hectare", "Square Yard (gaj)", "Bigha", "Biswa", "Katha / Kattha", "Guntha", "Cent", "Kanal", "Marla", "Ankanam", "Decimal"];
const steps = ["Basic Details", "Owner Detail", "Property Detail", "Image & Price"];

const Field = ({ label, value, onChangeText, placeholder, keyboardType, left, right, style }) => <View style={[{ marginBottom: 24 }, style]}>
  {!!label && <Text style={{ fontSize: 14, color: "#111", marginBottom: 10 }}>{label}</Text>}
  <View style={{ minHeight: 47, borderWidth: 1, borderColor: "#C9C9CE", borderRadius: 7, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, backgroundColor: "#fff" }}>
    {left}
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8E8E96" keyboardType={keyboardType} style={{ flex: 1, fontSize: 12, color: "#17171B", paddingVertical: 12 }} />
    {right}
  </View>
</View>;

const Choice = ({ selected, onPress, children, style }) => <Pressable onPress={onPress} style={[{ minHeight: 44, borderRadius: 7, borderWidth: selected ? 1 : 0, borderColor: PURPLE, backgroundColor: selected ? "#fff" : "#F7F7F8", alignItems: "center", justifyContent: "center", paddingHorizontal: 9 }, style]}>{children}</Pressable>;

export default function AddProperty() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { itemId, mode } = useLocalSearchParams();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState("residential");
  const [subType, setSubType] = useState("villa");
  const [kind, setKind] = useState("1 BHK");
  const [owner, setOwner] = useState({ name: "", phone: "", email: "", otp: "", address: "" });
  const [ownerOtp, setOwnerOtp] = useState({ token: "", verifiedToken: "", sending: false, verifying: false });
  const [details, setDetails] = useState({ name: "", tower: "", flat: "", location: "", city: "", state: "", pincode: "", latitude: null, longitude: null, projectId: "", totalArea: "", carpetArea: "", areaUnit: "Square Feet (sq ft)", khasra: "", age: "" });
  const [pricing, setPricing] = useState({ price: "", negotiable: false, excludeTax: false, paymentMode: "Full Payment", confirmed: false });
  const [images, setImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [picker, setPicker] = useState(null);
  const [ownerMapVisible, setOwnerMapVisible] = useState(false);
  const [propertyMapVisible, setPropertyMapVisible] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { brokerPropertyApi.getLiveProjects().then(r => setProjects(r.data?.data || [])).catch(() => setProjects([])); }, []);
  useEffect(() => {
    if (mode !== "edit" || !itemId) return;
    setBusy(true);
    brokerPropertyApi.getProperty(itemId).then(({ data }) => {
      const p = data?.data || {};
      setCategory(p.type || "residential");
      setSubType(p.property_subtype || p.sub_type || "villa");
      setKind(p.kind_of_property || p.description || "1 BHK");
      setOwner({ name: p.owner_name || "", phone: String(p.contact_no || "").replace(/\D/g, "").slice(-10), email: p.contact_email || "", otp: "", address: p.owner_address || "" });
      setDetails({ name: p.title || "", tower: p.tower_no || "", flat: p.flat_no || "", location: p.address || "", city: p.city || "", state: p.state || "", pincode: p.pincode || "", latitude: p.latitude || null, longitude: p.longitude || null, projectId: p.project_id || "", totalArea: String(p.total_area_sqft || ""), carpetArea: String(p.carpet_area || ""), areaUnit: p.area_unit || "Square Feet (sq ft)", khasra: p.khasra_no || "", age: String(p.property_age || "") });
      setPricing({ price: String(p.base_price || ""), negotiable: !!p.is_negotiable, excludeTax: p.tax_included === false, paymentMode: p.payment_mode || "Full Payment", confirmed: false });
      setImages((p.media || []).filter(x => x.media_type === "image"));
      setDocuments((p.media || []).filter(x => x.media_type === "document"));
    }).catch(e => Alert.alert("Could not load property", e.response?.data?.message || e.message)).finally(() => setBusy(false));
  }, [itemId, mode]);
  useEffect(() => { setSubType(current => subTypes[category].some(x => x.id === current) ? current : subTypes[category][0].id); }, [category]);
  useEffect(() => { setKind(current => (kindOptions[subType] || []).includes(current) ? current : (kindOptions[subType] || [""])[0]); }, [subType]);
  useEffect(() => { scrollRef.current?.scrollTo?.({ y: 0, animated: false }); }, [step]);

  const selectedProject = projects.find(p => p.id === details.projectId);
  const selectedUnitLabel = details.areaUnit.split(" (")[0];
  const validate = () => {
    if (step === 1 && (!category || !subType || !kind)) return "Select the property category, type and subtype.";
    if (step === 2 && (!owner.name.trim() || !owner.phone.trim() || !owner.address.trim())) return "Enter owner name, contact number and address.";
    if (step === 2 && !ownerOtp.verifiedToken) return "Verify the owner contact number with OTP.";
    if (step === 3 && (!details.location.trim() || !details.city.trim() || !details.state.trim() || !details.pincode.trim() || !details.projectId || !details.totalArea.trim())) return "Complete the location, parent project and area fields.";
    if (step === 4 && (images.length < 5 || !pricing.price.trim() || !pricing.confirmed)) return "Upload at least 5 photos, enter the selling price and confirm the declaration.";
    return null;
  };
  const next = () => { const error = validate(); if (error) return Alert.alert("Details required", error); setStep(s => Math.min(4, s + 1)); };
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: 8, quality: 0.85 });
    if (!result.canceled) setImages(prev => [...prev, ...result.assets].slice(0, 8));
  };
  const pickDocuments = async () => { const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true }); if (!result.canceled) setDocuments(result.assets.slice(0, 7)); };
  const sendOwnerOtp = async () => {
    const phone = owner.phone.replace(/\D/g, "");
    if (phone.length !== 10) return Alert.alert("Invalid number", "Enter a valid 10-digit owner contact number.");
    setOwnerOtp(x => ({ ...x, sending: true, verifiedToken: "" }));
    try {
      const response = await brokerPropertyApi.sendOwnerOtp(`+91${phone}`);
      setOwnerOtp({ token: response.data?.otp_token || "", verifiedToken: "", sending: false, verifying: false });
    } catch (e) {
      setOwnerOtp(x => ({ ...x, sending: false }));
      Alert.alert("Could not send OTP", e.response?.data?.message || e.message || "Please try again.");
    }
  };
  const verifyOwnerOtp = async () => {
    if (!ownerOtp.token) return Alert.alert("Send OTP first", "Request an OTP for the owner number.");
    if (owner.otp.length !== 6) return Alert.alert("Invalid OTP", "Enter the 6-digit OTP.");
    setOwnerOtp(x => ({ ...x, verifying: true }));
    try {
      const response = await brokerPropertyApi.verifyOwnerOtp(ownerOtp.token, owner.otp);
      setOwnerOtp(x => ({ ...x, verifiedToken: response.data?.verified_token || "", verifying: false }));
    } catch (e) {
      setOwnerOtp(x => ({ ...x, verifying: false, verifiedToken: "" }));
      Alert.alert("Verification failed", e.response?.data?.message || e.message || "Please check the OTP.");
    }
  };
  const submit = async () => {
    const error = validate(); if (error) return Alert.alert("Details required", error);
    setBusy(true);
    try {
      let id = itemId;
      if (mode === "edit" && itemId) {
        await brokerPropertyApi.updateProperty(itemId, { type: category, sub_type: subType, kind_of_property: kind, project_id: details.projectId });
      } else {
        const created = await brokerPropertyApi.createBasicDetails({ property_type: category, property_subtype: subType, listing_type: "buy", kind_of_property: kind, project_id: details.projectId, upload_source: "broker_app" });
        id = created.data?.data?.id;
      }
      await brokerPropertyApi.updateOwnerDetails(id, { title: details.name.trim() || `${kind} ${subTypes[category].find(x => x.id === subType)?.label || "Property"}`, owner_name: owner.name, owner_address: owner.address, contact_no: `+91${owner.phone}`, contact_email: owner.email || null, owner_verified_token: ownerOtp.verifiedToken });
      await brokerPropertyApi.updatePropertyDetails(id, { city: details.city, state: details.state, pincode: details.pincode, address: details.location, latitude: details.latitude, longitude: details.longitude, tower_no: details.tower, flat_no: details.flat, khasra_no: details.khasra, property_age: details.age || null, carpet_area: details.carpetArea || null, area_unit: details.areaUnit, project_id: details.projectId });
      await brokerPropertyApi.updateAreaDetails(id, { total_area_sqft: details.totalArea, total_area: details.totalArea, area_unit: details.areaUnit });
      const newImages = images.filter(x => x.uri);
      const newDocuments = documents.filter(x => x.uri);
      if (newImages.length || newDocuments.length) {
        const form = new FormData();
        newImages.forEach((f, i) => form.append("images", { uri: f.uri, name: f.fileName || `property-${i + 1}.jpg`, type: f.mimeType || "image/jpeg" }));
        newDocuments.forEach((f, i) => form.append("documents", { uri: f.uri, name: f.name || `document-${i + 1}`, type: f.mimeType || "application/octet-stream" }));
        await brokerPropertyApi.uploadMedia(id, form);
      }
      await brokerPropertyApi.updatePricingDetails(id, { selling_price: pricing.price, is_negotiable: pricing.negotiable, tax_included: !pricing.excludeTax, payment_mode: pricing.paymentMode, submit: true });
      navigation.navigate("favourite");
    } catch (e) { Alert.alert("Could not submit", e.response?.data?.message || e.message || "Please try again."); } finally { setBusy(false); }
  };

  const renderStep1 = () => <>
    <Text style={{ fontSize: 14, marginBottom: 16 }}>Property Type</Text>
    <View style={{ flexDirection: "row", gap: 11, marginBottom: 28 }}>{mainTypes.map(x => <Choice key={x.id} selected={category === x.id} onPress={() => setCategory(x.id)} style={{ flex: 1, height: 95, alignItems: "stretch", overflow: "hidden" }}><Text style={{ position: "absolute", top: 11, left: 10, fontSize: 12 }}>{x.label}</Text><Image source={x.image} resizeMode="contain" style={{ width: "72%", height: 76, alignSelf: "flex-end", marginTop: 25 }} /></Choice>)}</View>
    <Text style={{ fontSize: 14, marginBottom: 16 }}>Property Type</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 36 }}>{subTypes[category].map(x => <Choice key={x.id} selected={subType === x.id} onPress={() => setSubType(x.id)} style={{ width: 80, height: 85, overflow: "hidden" }}><Text style={{ position: "absolute", top: 8, fontSize: 11 }}>{x.label}</Text><Image source={x.image} resizeMode="contain" style={{ width: 64, height: 59, marginTop: 24 }} /></Choice>)}</ScrollView>
    <Text style={{ fontSize: 14, marginBottom: 18 }}>what kind of property?</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>{(kindOptions[subType] || []).map(x => <Choice key={x} selected={kind === x} onPress={() => setKind(x)} style={{ width: "30.5%" }}><Text style={{ color: "#595960", fontSize: 12, textAlign: "center" }}>{x}</Text></Choice>)}</View>
    <Field label="Owner Email Address (Optional)" value={owner.email} onChangeText={v => setOwner(o => ({ ...o, email: v }))} placeholder="eg. squarft@gmail.com" style={{ marginTop: 34 }} />
  </>;
  const renderStep2 = () => <>
    <Field label="Owner Name" value={owner.name} onChangeText={v => setOwner(o => ({ ...o, name: v }))} placeholder="Enter Owner Name" />
    <Field label="Owner Contact No." value={owner.phone} onChangeText={v => { setOwner(o => ({ ...o, phone: v.replace(/\D/g, "").slice(0, 10) })); setOwnerOtp({ token: "", verifiedToken: "", sending: false, verifying: false }); }} placeholder="8120180101" keyboardType="phone-pad" left={<Text style={{ color: "#17171B", fontSize: 13, marginRight: 7 }}>+91</Text>} right={<Pressable disabled={ownerOtp.sending} onPress={sendOwnerOtp}><Text style={{ color: PURPLE, fontSize: 14 }}>{ownerOtp.sending ? "Sending..." : ownerOtp.token ? "Resend OTP" : "Send OTP"}</Text></Pressable>} />
    <Field label="Enter OTP" value={owner.otp} onChangeText={v => setOwner(o => ({ ...o, otp: v.replace(/\D/g, "").slice(0, 6) }))} placeholder="Enter 6-digit OTP" keyboardType="number-pad" right={ownerOtp.verifiedToken ? <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Ionicons name="checkmark-circle" size={19} color="#16A34A" /><Text style={{ color: "#16A34A", fontSize: 12 }}>Verified</Text></View> : <Pressable disabled={ownerOtp.verifying} onPress={verifyOwnerOtp}><Text style={{ color: PURPLE, fontSize: 13 }}>{ownerOtp.verifying ? "Verifying..." : "Verify OTP"}</Text></Pressable>} />
    <Field label="Owner Address" value={owner.address} onChangeText={v => setOwner(o => ({ ...o, address: v }))} placeholder="Select Address" right={<Pressable onPress={() => { Keyboard.dismiss(); setOwnerMapVisible(true); }} hitSlop={12} style={{ width: 30, height: 30, borderRadius: 7, backgroundColor: "#EBEAFF", alignItems: "center", justifyContent: "center" }}><Ionicons name="map-outline" size={18} color={PURPLE} /></Pressable>} />
  </>;
  const renderStep3 = () => <>
    <Field label="Property Name (if applicable) :" value={details.name} onChangeText={v => setDetails(d => ({ ...d, name: v }))} placeholder="Enter Property name" />
    <Text style={{ fontSize: 14, marginBottom: 10 }}>Plot / Flat / Villa, shop, office, showroom  House no.</Text>
    <View style={{ flexDirection: "row", gap: 10 }}><Field value={details.tower} onChangeText={v => setDetails(d => ({ ...d, tower: v }))} placeholder="Tower no." style={{ flex: 1 }} /><Field value={details.flat} onChangeText={v => setDetails(d => ({ ...d, flat: v }))} placeholder="Flat no." style={{ flex: 1 }} /></View>
    <Field label="Location" value={details.location} onChangeText={v => setDetails(d => ({ ...d, location: v }))} placeholder="Address & Landmark" right={<Pressable onPress={() => { Keyboard.dismiss(); setPropertyMapVisible(true); }} hitSlop={12} style={{ width: 30, height: 30, borderRadius: 7, backgroundColor: "#EBEAFF", alignItems: "center", justifyContent: "center" }}><Ionicons name="map-outline" size={18} color={PURPLE} /></Pressable>} />
    <View style={{ flexDirection: "row", gap: 10 }}><Field label="City" value={details.city} onChangeText={v => setDetails(d => ({ ...d, city: v }))} placeholder="city" style={{ flex: 1 }} /><Field label="State" value={details.state} onChangeText={v => setDetails(d => ({ ...d, state: v }))} placeholder="state" style={{ flex: 1 }} /><Field label="Pincode" value={details.pincode} onChangeText={v => setDetails(d => ({ ...d, pincode: v }))} placeholder="pincode" keyboardType="number-pad" style={{ flex: 1 }} /></View>
    <Text style={{ fontSize: 14, marginBottom: 10 }}>Select Project</Text><Pressable onPress={() => setPicker("project")} style={{ height: 47, borderWidth: 1, borderColor: "#C9C9CE", borderRadius: 7, paddingHorizontal: 14, alignItems: "center", flexDirection: "row", marginBottom: 24 }}><Text style={{ flex: 1, color: selectedProject ? "#17171B" : "#8E8E96", fontSize: 12 }}>{selectedProject?.name || "Select Live Project Near You"}</Text><Ionicons name="chevron-down-circle-outline" size={18} color="#BFC0C7" /></Pressable>
    <View style={{ flexDirection: "row", gap: 24 }}><Field label="Total Area" value={details.totalArea} onChangeText={v => setDetails(d => ({ ...d, totalArea: v }))} placeholder="eg 1000" keyboardType="decimal-pad" right={<Pressable onPress={() => setPicker("unit")}><Text style={{ fontSize: 11 }}>{selectedUnitLabel}</Text></Pressable>} style={{ flex: 1 }} /><Field label="Carpet Area" value={details.carpetArea} onChangeText={v => setDetails(d => ({ ...d, carpetArea: v }))} placeholder="eg 200" keyboardType="decimal-pad" right={<Pressable onPress={() => setPicker("unit")}><Text style={{ fontSize: 11 }}>{selectedUnitLabel}</Text></Pressable>} style={{ flex: 1 }} /></View>
    <Field label="Khasra number" value={details.khasra} onChangeText={v => setDetails(d => ({ ...d, khasra: v }))} placeholder="Enter khasra number" />
    <Field label="Property Age" value={details.age} onChangeText={v => setDetails(d => ({ ...d, age: v }))} placeholder="Enter Property age" keyboardType="number-pad" />
  </>;
  const UploadBox = ({ title, subtitle, onPress, count }) => <Pressable onPress={onPress} style={{ height: 154, borderRadius: 8, backgroundColor: "#ECF1FF", alignItems: "center", justifyContent: "center", marginBottom: 31 }}><MaterialCommunityIcons name="image-plus" size={35} color="#756CF8" /><Text style={{ color: "#756CF8", fontSize: 17, fontWeight: "700", marginTop: 9 }}>{count ? `${count} selected` : title}</Text><Text style={{ color: "#B9BBC4", fontSize: 11, marginTop: 5 }}>{subtitle}</Text></Pressable>;
  const renderStep4 = () => <>
    <Text style={{ fontSize: 14, marginBottom: 42 }}>Upload Property Images & Documents</Text><Text style={{ fontSize: 12, marginBottom: 14 }}>Upload Images</Text><UploadBox title="Add atleast 5 Photos" count={images.length} subtitle="click from camera or browse to upload" onPress={pickImages} />
    <Text style={{ fontSize: 12, marginBottom: 14 }}>Upload Property Documents <Text style={{ color: "#8D8D94" }}>(Optional)</Text></Text><UploadBox title="Upload Documents" count={documents.length} subtitle="click from camera or browse to upload" onPress={pickDocuments} />
    <Field label="Selling Price" value={pricing.price} onChangeText={v => setPricing(p => ({ ...p, price: v }))} placeholder="₹" keyboardType="decimal-pad" />
    {[['negotiable','Price Negotiable'], ['excludeTax','Tax and Govt. charges exclude']].map(([key,label]) => <Pressable key={key} onPress={() => setPricing(p => ({ ...p, [key]: !p[key] }))} style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}><Ionicons name={pricing[key] ? "checkbox" : "square-outline"} size={20} color={pricing[key] ? PURPLE : "#999"} /><Text style={{ marginLeft: 9, fontSize: 12 }}>{label}</Text></Pressable>)}
    <Text style={{ fontSize: 14, marginTop: 18, marginBottom: 14 }}>Preferred Payment Mode</Text><View style={{ flexDirection: "row", gap: 12, marginBottom: 34 }}>{["Full Payment", "EMI/ Loan Option Available"].map(x => <Choice key={x} selected={pricing.paymentMode === x} onPress={() => setPricing(p => ({ ...p, paymentMode: x }))}><Text style={{ color: pricing.paymentMode === x ? "#7067F5" : "#555", fontSize: 11 }}>{x}</Text></Choice>)}</View>
    <Text style={{ fontSize: 14, marginBottom: 14 }}>Agreement & Submission</Text><Pressable onPress={() => setPricing(p => ({ ...p, confirmed: !p.confirmed }))} style={{ flexDirection: "row", alignItems: "flex-start" }}><Ionicons name={pricing.confirmed ? "checkbox" : "square-outline"} size={20} color={pricing.confirmed ? PURPLE : "#999"} /><Text style={{ flex: 1, marginLeft: 10, fontSize: 12, lineHeight: 17 }}>I confirm that the provided details are accurate and that I am the legal owner or have the right to list this property for sale.</Text></Pressable>
  </>;

  const pickerItems = picker === "project" ? projects : areaUnits.map(x => ({ id: x, name: x }));
  return <SafeAreaView style={{ flex: 1, backgroundColor: PURPLE }} edges={["top"]}><StatusBar barStyle="light-content" backgroundColor={PURPLE} />
    <View style={{ height: 176, paddingHorizontal: 22, paddingTop: 16 }}><View style={{ flexDirection: "row", alignItems: "center" }}><Pressable onPress={() => step > 1 ? setStep(step - 1) : router.back()} hitSlop={15}><Ionicons name="arrow-back" color="#fff" size={24} /></Pressable><Text style={{ flex: 1, textAlign: "center", color: "#fff", fontSize: 17, fontWeight: "700", marginRight: 24 }}>Add Property</Text></View><View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 52 }}>{steps.map((x, i) => <View key={x} style={{ width: "24%", alignItems: "center" }}><View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: "#fff", backgroundColor: step === i + 1 ? "#fff" : "transparent", alignItems: "center", justifyContent: "center" }}><Text style={{ color: step === i + 1 ? PURPLE : "#fff", fontSize: 11 }}>{i + 1}</Text></View><Text numberOfLines={1} style={{ color: "#fff", opacity: step === i + 1 ? 1 : .82, fontSize: 10, marginTop: 9 }}>{x}</Text></View>)}</View></View>
    <View style={{ flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 23, borderTopRightRadius: 23, overflow: "hidden" }}><ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 21, paddingTop: 22, paddingBottom: 150 + insets.bottom }}>{step === 1 ? renderStep1() : step === 2 ? renderStep2() : step === 3 ? renderStep3() : renderStep4()}</ScrollView><View style={{ position: "absolute", left: 19, right: 19, bottom: (Platform.OS === "ios" ? 76 : 66) + insets.bottom + 14 }}><TouchableOpacity disabled={busy} onPress={step === 4 ? submit : next} style={{ height: 51, borderRadius: 9, backgroundColor: PURPLE, alignItems: "center", justifyContent: "center", shadowColor: PURPLE, shadowOpacity: .25, shadowRadius: 9, elevation: 5 }}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 15 }}>{step === 4 ? "Submit" : "Next"}</Text>}</TouchableOpacity></View></View>
    <Modal visible={!!picker} transparent animationType="slide" onRequestClose={() => setPicker(null)}><Pressable onPress={() => setPicker(null)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,.28)", justifyContent: "flex-end" }}><Pressable style={{ backgroundColor: "#fff", borderTopLeftRadius: 48, borderTopRightRadius: 48, minHeight: 430, maxHeight: "72%", padding: 24, paddingTop: 56 }}><Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 20 }}>{picker === "project" ? "Select live project" : "Select area unit"}</Text><ScrollView>{pickerItems.map(item => <Pressable key={item.id} onPress={() => { if (picker === "project") setDetails(d => ({ ...d, projectId: item.id })); else setDetails(d => ({ ...d, areaUnit: item.name })); setPicker(null); }} style={{ paddingVertical: 12 }}><Text style={{ fontSize: 15, color: "#171B31" }}>{item.name}{item.city ? ` · ${item.city}` : ""}</Text></Pressable>)}</ScrollView></Pressable></Pressable></Modal>
    <LocationMapPicker visible={ownerMapVisible} initialAddress={{ location: owner.address }} onClose={() => setOwnerMapVisible(false)} onConfirm={(address) => { setOwner(o => ({ ...o, address: address.location || o.address })); setOwnerMapVisible(false); }} confirmLabel="Add this address" />
    <LocationMapPicker visible={propertyMapVisible} initialAddress={details} onClose={() => setPropertyMapVisible(false)} onConfirm={(address) => { setDetails(d => ({ ...d, location: address.location || d.location, city: address.city || d.city, state: address.state || d.state, pincode: address.pincode || d.pincode, latitude: address.latitude, longitude: address.longitude })); setPropertyMapVisible(false); }} confirmLabel="Add this location" />
  </SafeAreaView>;
}
