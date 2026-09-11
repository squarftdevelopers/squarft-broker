import { Text, View, TextInput, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { setMobile, setOtpFlow } from "../../store/slices/authSlice";

const logo = require("../../assets/icons/app-icon.png");

export default function ForgotPassword() {
    const dispatch = useDispatch();
    const { mobile } = useSelector((state) => state.auth);

    const handleSendOtp = () => {
        dispatch(setOtpFlow('forgot-password'));
        router.push("/(auth)/otp-verification");
    };

    return (
        <View className="flex-1">
            <StatusBar style="light" />

      
            <View className="bg-[#4A43EC] pt-16 pb-10 px-6">
                <View style={{ width: 60, height: 60, overflow: 'hidden' }} className="mb-6">
                    <Image source={logo} style={{ width: 110, height: 110, margin: -20 }} resizeMode="contain" />
                </View>
                <Text className="text-white text-[32px] font-bold mb-1">Forgot Password</Text>
                <Text className="text-white/80 text-[14px]">Enter your registered mobile number</Text>
            </View>

        
            <View className="flex-1 bg-white px-6 pt-8">

                <Text className="text-gray-500 text-[13px] mb-1.5">Mobile Number</Text>
                <View className="border border-gray-200 rounded-xl px-4 py-2 mb-8">
                    <TextInput
                        value={mobile}
                        onChangeText={(val) => dispatch(setMobile(val))}
                        placeholder="Phone Number"
                        placeholderTextColor="#aaa"
                        keyboardType="phone-pad"
                        className="text-[15px] text-black"
                    />
                </View>

                <TouchableOpacity
                    onPress={handleSendOtp}
                    className="bg-[#4A43EC] rounded-2xl py-4 items-center"
                >
                    <Text className="text-white text-[16px] font-semibold">Send OTP</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}
