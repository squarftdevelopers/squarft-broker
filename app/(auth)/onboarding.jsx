import { Image } from "expo-image";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCallback } from "react";

const onboardingImage = require("../../assets/images/splash-mobile.gif");

export default function Onboarding() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleNext = useCallback(() => {
        router.replace("/(auth)/login");
    }, [router]);

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" hidden />
            
            <Image
                source={onboardingImage}
                style={StyleSheet.absoluteFill}
                contentFit="contain"
            />

            {/* Next Button Overlay */}
            <View 
                style={{ bottom: Math.max(insets.bottom, 24), right: 24 }}
                className="absolute z-50"
            >
                <TouchableOpacity 
                    onPress={handleNext}
                    activeOpacity={0.8}
                    className="bg-[#4848FF] px-6 py-2.5 rounded-full shadow-lg flex-row items-center justify-center"
                >
                    <Text className="text-white text-[14px] font-bold tracking-widest">
                        NEXT
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
