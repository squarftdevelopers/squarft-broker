import {
  Image,
  Text,
  View,
  Pressable,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { logout, deleteAccount, fetchUserProfile, fetchKyc, updateProfilePicture } from "../../store/slices/authSlice";
import { useEffect, useState } from "react";

const { width, height } = Dimensions.get("window");

export default function Settings() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, loading, kyc } = useSelector((state) => state.auth);
  const [changingPhoto, setChangingPhoto] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchKyc());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action is permanent and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingAccount(true);
            try {
              await dispatch(deleteAccount()).unwrap();
              router.replace("/");
            } catch (err) {
              Alert.alert("Delete failed", err || "Unable to delete account. Please try again.");
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const handleChangePhoto = async () => {
    if (changingPhoto || loading) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Permission needed', 'Allow photo library access to change your profile image.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    setChangingPhoto(true);
    try { await dispatch(updateProfilePicture(result.assets[0])).unwrap(); Alert.alert('Profile updated', 'Your profile image has been updated.'); }
    catch (error) { Alert.alert('Upload failed', error || 'Unable to update your profile image.'); }
    finally { setChangingPhoto(false); }
  };

  const menuItems = [
    { id: 1, label: "Home", icon: "home-outline", type: "ionicons" },
    { id: 2, label: "My added", icon: "plus-box-outline", type: "material-community" },
    { id: 6, label: "KYC Verification", icon: "card-account-details-outline", type: "material-community" },
    {
      id: 3,
      label: "Term and conditions",
      icon: "file-document-outline",
      type: "material-community",
    },
    { id: 4, label: "Privacy Policy", icon: "shield-outline", type: "ionicons" },
    { id: 5, label: "Contact Us", icon: "call-outline", type: "ionicons" },
    { id: 7, label: "FAQs", icon: "help-circle-outline", type: "ionicons" },
  ];

  const displayName = user?.full_name || user?.first_name || "User";
  const displayPhone = user?.phone || "N/A";
  const displayEmail = user?.email || "No email";
  const avatarUrl = user?.avatar_url || kyc?.profile_photo_url;

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      <View
        className="bg-[#4D45ED] h-[200px] w-full absolute top-0"
        style={{
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32
        }}
      >
        <View
          className="flex-row items-center justify-center w-full px-6"
          style={{ paddingTop: Platform.OS === "ios" ? 60 : 45 }}
        >
          <Text className="text-white text-[18px] font-lato-bold">Profile</Text>
        </View>
      </View>

      <View
        style={{
          position: 'absolute',
          left: -width * 0.38,
          top: height * 0.43,
          width: width * 0.85,
          height: width * 0.85,
          borderRadius: (width * 0.85) / 2,
          backgroundColor: 'rgba(180, 176, 240, 0.18)',
          zIndex: 0,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: width * 0.045 - width * 0.315,
          top: height * 0.43 + width * 0.425 - width * 0.315,
          width: width * 0.63,
          height: width * 0.63,
          borderRadius: (width * 0.63) / 2,
          backgroundColor: 'rgba(155, 149, 226, 0.19)',
          zIndex: 0,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: width * 0.045 - width * 0.15,
          top: height * 0.43 + width * 0.425 - width * 0.15,
          width: width * 0.30,
          height: width * 0.30,
          borderRadius: (width * 0.30) / 2,
          backgroundColor: 'rgba(120, 112, 210, 0.20)',
          zIndex: 0,
        }}
      />

      <View
        style={{ paddingTop: 120, paddingHorizontal: 20, paddingBottom: 100 }}
      >
        <View
          className="bg-white rounded-[22px] p-4 mb-12"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 5,
          }}
        >
          {loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#4D45ED" />
            </View>
          ) : (
            <>
              <View className="flex-row items-center mb-8">
                <Pressable onPress={handleChangePhoto} className="w-[55px] h-[55px] rounded-full bg-[#F0F0FF] items-center justify-center">
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} className="w-full h-full rounded-full" resizeMode="cover" />
                  ) : <Ionicons name="person-outline" size={24} color="#4D45ED" />}
                  <View className="absolute -right-2 -bottom-1 bg-[#4D45ED] rounded-full p-1"><Ionicons name="camera" size={12} color="white" /></View>
                </Pressable>
                <View className="ml-6 flex-1">
                  <Text className="text-[16px] text-[#272727] font-manrope-extrabold tracking-tight">
                    {displayName.toUpperCase()}
                  </Text>
                  <Text className="text-[12px] text-gray-400 mt-0.5 font-manrope">
                    {displayPhone}
                  </Text>
                  {displayEmail !== "No email" && displayEmail !== "No email provided" && (
                    <Text className="text-[11px] text-gray-400 mt-0.5 font-manrope">
                      {displayEmail}
                    </Text>
                  )}
                </View>
              </View>

              <View className="flex-row justify-between">
                <Pressable
                  onPress={() => router.push("/(screens)/wallet")}
                  className="flex-1 bg-[#E1E0FF] rounded-[14px] p-3 flex-row items-center justify-between h-[65px]"
                  style={{ marginRight: 8 }}
                >
                  <Text className="text-[14px] text-[#1E1E1E] font-lato-bold">Wallet</Text>
                  <View className="bg-[#1C1C1C] p-1.5 rounded-[10px] items-center justify-center">
                    <MaterialCommunityIcons name="wallet" size={16} color="white" />
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => router.push("/(screens)/my-documents")}
                  className="flex-1 bg-[#E1E0FF] rounded-[14px] p-3 flex-row items-center justify-between h-[65px]"
                  style={{ marginLeft: 8 }}
                >
                  <Text className="text-[14px] text-[#1E1E1E] font-lato-bold">Document</Text>
                  <View className="bg-[#1C1C1C] p-1.5 rounded-[10px] items-center justify-center">
                    <MaterialCommunityIcons name="file-document" size={16} color="white" />
                  </View>
                </Pressable>
              </View>
            </>
          )}
        </View>

        <View
          className="rounded-[24px] p-1.5 mb-6 border border-gray-200"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 10,
          }}
        >
          {menuItems.map((item, index) => (
            <Pressable
              key={item.id}
              className="py-5 px-5 flex-row items-center"
              onPress={() => {
                if (item.id === 1) router.push("/home");
                if (item.id === 2) router.push("/favourite");
                if (item.id === 3) router.push({ pathname: "/(screens)/coming-soon", params: { title: "Terms & Conditions" } });
                if (item.id === 4) router.push({ pathname: "/(screens)/coming-soon", params: { title: "Privacy Policy" } });
                if (item.id === 5) router.push({ pathname: "/(screens)/coming-soon", params: { title: "Contact Us" } });
                if (item.id === 7) router.push({ pathname: "/(screens)/coming-soon", params: { title: "FAQs" } });
                if (item.id === 6) router.push("/(screens)/kyc");
              }}
            >
              <View className="w-8 items-center mr-4">
                {item.type === "ionicons" ? (
                  <Ionicons name={item.icon} size={20} color="#374151" />
                ) : item.type === "material" ? (
                  <MaterialIcons name={item.icon} size={20} color="#374151" />
                ) : (
                  <MaterialCommunityIcons name={item.icon} size={20} color="#374151" />
                )}
              </View>
              <Text className="text-[14px] text-[#333] font-lato-medium">{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleLogout}
          disabled={deletingAccount}
          className="rounded-[24px] py-3 items-center flex-row justify-center border border-gray-200 mb-3"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 10,
          }}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#FF3B30" style={{ marginRight: 10 }} />
          <Text className="text-[15px] text-[#4D45ED] font-lato-bold">Logout</Text>
        </Pressable>

        <Pressable
          onPress={handleDeleteAccount}
          disabled={deletingAccount}
          className="rounded-[24px] py-3 items-center flex-row justify-center border border-red-200 mb-8"
          style={{
            backgroundColor: '#FEF2F2',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 10,
          }}
        >
          {deletingAccount ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={19} color="#DC2626" style={{ marginRight: 8 }} />
              <Text className="text-[15px] text-[#DC2626] font-lato-bold">Delete Account</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
