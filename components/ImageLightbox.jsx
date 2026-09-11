import React, { useRef, useState, useEffect } from "react";
import { View, Image, TouchableOpacity, Modal, ScrollView, Dimensions, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Full-screen image gallery viewer — swipe (or tap the arrows) through every
 * image, with a live "x / N" counter. Opened from a single cover image on a
 * card; `startIndex` lets the caller open directly on whichever image was
 * tapped.
 */
export default function ImageLightbox({ visible, images = [], startIndex = 0, onClose }) {
    const scrollRef = useRef(null);
    const [index, setIndex] = useState(startIndex);

    useEffect(() => {
        if (visible) {
            setIndex(startIndex);
            // Jump to the requested image without an animated scroll once the
            // modal (and therefore the ScrollView) has actually mounted.
            requestAnimationFrame(() => {
                scrollRef.current?.scrollTo({ x: startIndex * SCREEN_WIDTH, animated: false });
            });
        }
    }, [visible, startIndex]);

    const goTo = (nextIndex) => {
        const clamped = Math.max(0, Math.min(images.length - 1, nextIndex));
        setIndex(clamped);
        scrollRef.current?.scrollTo({ x: clamped * SCREEN_WIDTH, animated: true });
    };

    const handleMomentumScrollEnd = (e) => {
        const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setIndex(newIndex);
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="fade" transparent={false} presentationStyle="fullScreen" onRequestClose={onClose}>
            {/* See LocationMapPicker.jsx for why: a fullScreen Modal presents
                into its own native surface, so the app-root SafeAreaProvider's
                insets don't reliably reach it — nest one here too. */}
            <SafeAreaProvider>
                <View className="flex-1 bg-black">
                    <SafeAreaView className="flex-1">
                        <View className="flex-row items-center justify-between px-4 pt-2">
                            <View className="bg-white/10 rounded-full px-3 py-1.5">
                                <Text className="text-white text-xs font-lato-bold">{index + 1} / {images.length}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={onClose}
                                className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
                            >
                                <Ionicons name="close" size={22} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            ref={scrollRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={handleMomentumScrollEnd}
                            className="flex-1"
                        >
                            {images.map((uri, i) => (
                                <View key={`${uri}-${i}`} style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center">
                                    <Image source={{ uri }} style={{ width: SCREEN_WIDTH, height: "100%" }} resizeMode="contain" />
                                </View>
                            ))}
                        </ScrollView>

                        {images.length > 1 && (
                            <View className="flex-row items-center justify-between px-4 pb-3">
                                <TouchableOpacity
                                    onPress={() => goTo(index - 1)}
                                    disabled={index === 0}
                                    className="w-11 h-11 rounded-full bg-white/10 items-center justify-center"
                                    style={{ opacity: index === 0 ? 0.3 : 1 }}
                                >
                                    <Ionicons name="chevron-back" size={22} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => goTo(index + 1)}
                                    disabled={index === images.length - 1}
                                    className="w-11 h-11 rounded-full bg-white/10 items-center justify-center"
                                    style={{ opacity: index === images.length - 1 ? 0.3 : 1 }}
                                >
                                    <Ionicons name="chevron-forward" size={22} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </SafeAreaView>
                </View>
            </SafeAreaProvider>
        </Modal>
    );
}
