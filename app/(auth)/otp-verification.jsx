import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Redirect, router } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearError, clearOtp, loginUser, registerUser, sendOtpApi, setOtpDigit, verifyOtpApi, fetchUserProfile, fetchKyc } from "../../store/slices/authSlice";

const logo = require("../../assets/icons/app-icon.png");

export default function OtpVerification() {
    const dispatch = useDispatch();
    const otp = useSelector((state) => state.auth?.otp || ["", "", "", "", "", ""]);
    const otpFlow = useSelector((state) => state.auth?.otpFlow);
    const otpToken = useSelector((state) => state.auth?.otpToken);
    const name = useSelector((state) => state.auth?.name || "");
    const mobile = useSelector((state) => state.auth?.mobile || "");
    const loading = useSelector((state) => state.auth?.loading);
    const error = useSelector((state) => state.auth?.error);
    const inputs = useRef([]);
    const submitted = useRef(false);

    useEffect(() => {
        dispatch(clearError());
        const timer = setTimeout(() => inputs.current[0]?.focus(), 300);
        return () => clearTimeout(timer);
    }, [dispatch]);

    const change = useCallback((text, index) => {
        const digits = text.replace(/[^0-9]/g, "");
        if (digits.length > 1) {
            digits.slice(0, 6).split("").forEach((digit, digitIndex) => dispatch(setOtpDigit({ index: digitIndex, value: digit })));
            if (digits.length === 6) Keyboard.dismiss();
            return;
        }
        dispatch(setOtpDigit({ index, value: digits.slice(-1) }));
        if (digits && index < 5) inputs.current[index + 1]?.focus();
    }, [dispatch]);

    const verify = useCallback(async () => {
        if (loading || submitted.current || otp.join("").length !== 6) return;
        submitted.current = true;
        const verification = await dispatch(verifyOtpApi({ otp_token: otpToken, otp: otp.join("") }));
        if (verifyOtpApi.fulfilled.match(verification)) {
            const verifiedToken = verification.payload.verified_token;
            let result;
            if (otpFlow === "login") result = await dispatch(loginUser({ verified_token: verifiedToken }));
            else {
                const [first_name, ...rest] = name.trim().split(/\s+/);
                result = await dispatch(registerUser({ verified_token: verifiedToken, first_name, last_name: rest.join(" ") }));
            }
            if ((loginUser.fulfilled.match(result) || registerUser.fulfilled.match(result)) && result.payload.token) {
                dispatch(clearOtp());
                dispatch(fetchUserProfile());
                dispatch(fetchKyc());
                router.replace("/(tabs)/home");
            }
        }
        submitted.current = false;
    }, [dispatch, loading, name, otp, otpFlow, otpToken]);

    useEffect(() => {
        if (otp.join("").length === 6 && !loading && !submitted.current) {
            Keyboard.dismiss();
            verify();
        }
    }, [loading, otp, verify]);

    const resend = useCallback(async () => {
        if (loading) return;
        dispatch(clearOtp());
        submitted.current = false;
        await dispatch(sendOtpApi({ phone: mobile, purpose: otpFlow }));
        inputs.current[0]?.focus();
    }, [dispatch, loading, mobile, otpFlow]);

    if (!otpToken || !mobile) return <Redirect href="/(auth)/login" />;

    return (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1">
                    <StatusBar style="light" />
                    <View style={{ paddingTop: 64, paddingBottom: 40, paddingHorizontal: 24, backgroundColor: "#4A43EC" }}>
                        <View style={{ width: 60, height: 60, overflow: "hidden", marginBottom: 1 }}>
                            <Image source={logo} style={{ width: 110, height: 110, margin: -26 }} resizeMode="contain" />
                        </View>
                        <Text className="text-white text-[26px] font-manrope-bold mb-5">OTP Verification</Text>
                        <Text className="text-white/80 text-[14px]">OTP has been sent to {mobile}</Text>
                    </View>
                    <View className="flex-1 bg-white px-8 pt-10">
                        <View className="flex-row justify-center mb-10" style={{ gap: 12 }}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => {
                                        inputs.current[index] = ref;
                                    }}
                                    value={digit}
                                    onChangeText={(text) => change(text, index)}
                                    onKeyPress={(event) =>
                                        event.nativeEvent.key === "Backspace" && !otp[index] && index > 0 && inputs.current[index - 1]?.focus()
                                    }
                                    keyboardType="number-pad"
                                    textContentType={index === 0 ? "oneTimeCode" : "none"}
                                    autoComplete={index === 0 ? "sms-otp" : "off"}
                                    importantForAutofill={index === 0 ? "yes" : "no"}
                                    maxLength={index === 0 ? 6 : 1}
                                    style={{
                                        width: 48,
                                        height: 56,
                                        borderWidth: 1,
                                        borderColor: digit ? "#4A43EC" : "#E5E7EB",
                                        borderRadius: 12,
                                        textAlign: "center",
                                        fontSize: 18,
                                        color: "#000",
                                    }}
                                />
                            ))}
                        </View>
                        {error ? <Text className="text-red-500 text-[13px] mb-4 text-center">{error}</Text> : null}
                        <TouchableOpacity
                            onPress={verify}
                            disabled={loading}
                            className="bg-[#4A43EC] rounded-2xl py-4 items-center mb-10"
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-[15px] font-semibold">Submit</Text>}
                        </TouchableOpacity>
                        <View className="flex-row justify-center">
                            <Text className="text-gray-500 text-[14px]">{"Didn\u2019t get the OTP?  "}</Text>
                            <TouchableOpacity onPress={resend}>
                                <Text className="text-[#4A43EC] text-[14px] font-semibold">Resend OTP</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}
