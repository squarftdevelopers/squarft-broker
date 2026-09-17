import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Platform, useColorScheme } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { Provider, useDispatch } from 'react-redux';
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import { store } from '../store/store';
import { loadToken } from '../store/slices/authSlice';
import {
    useFonts,
    Lato_400Regular,
    Lato_700Bold,
    Lato_300Light,
    Lato_900Black,
} from "@expo-google-fonts/lato";
import {
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import PushNotificationRegistrar from "../components/PushNotificationRegistrar";
import AnimatedSplashScreen from "../components/AnimatedSplashScreen";
import KycModal from "../components/KycModal";
import {
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    Roboto_300Light,
} from "@expo-google-fonts/roboto";

SplashScreen.preventAutoHideAsync();

function AppInit({ children }) {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(loadToken());
    }, [dispatch]);
    return children;
}

export default function AuthLayout() {
    const colorScheme = useColorScheme();
    const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
    const [fontsLoaded] = useFonts({
        'Lato-Regular': Lato_400Regular,
        'Lato-Bold': Lato_700Bold,
        'Lato-Light': Lato_300Light,
        'Lato-Black': Lato_900Black,
        Roboto_400Regular,
        Roboto_500Medium,
        Roboto_700Bold,
        Roboto_300Light,
        'Manrope-Regular': Manrope_400Regular,
        'Manrope-Medium': Manrope_500Medium,
        'Manrope-SemiBold': Manrope_600SemiBold,
        'Manrope-Bold': Manrope_700Bold,
        'Manrope-ExtraBold': Manrope_800ExtraBold,
    });

    useEffect(() => {
        if (Platform.OS !== "android") return;
        NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => { });
        NavigationBar.setButtonStyleAsync("dark").catch(() => { });
    }, [colorScheme]);

    useEffect(() => {
        if (fontsLoaded) {
            const timer = setTimeout(() => {
                SplashScreen.hideAsync().catch((err) => {
                console.warn("SplashScreen.hideAsync error:", err);
                });
            }, 180);
            return () => clearTimeout(timer);
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <Provider store={store}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                    <StatusBar style="dark" backgroundColor="transparent" translucent={true} />
                    <BottomSheetModalProvider>
                        <AppInit>
                            <PushNotificationRegistrar />
                            <Stack>
                                <Stack.Screen name="index" options={{ headerShown: false }} />
                                <Stack.Screen name="(auth)" options={{ headerShown: false, animation: "none" }} />
                                <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "none" }} />
                                <Stack.Screen name="(screens)" options={{ headerShown: false }} />
                            </Stack>
                            <KycModal />
                            {showAnimatedSplash && (
                                <AnimatedSplashScreen onFinish={() => setShowAnimatedSplash(false)} />
                            )}
                        </AppInit>
                    </BottomSheetModalProvider>
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </Provider>
    );
}
