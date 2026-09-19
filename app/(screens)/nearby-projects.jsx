import React, { useCallback, useEffect, useMemo } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Platform,
    Pressable,
    RefreshControl,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { fetchNearbyProjects, pickNearbyProject } from "../../store/slices/propertySlice";

const DEFAULT_RADIUS = 10;

const firstParam = (value, fallback = "") => Array.isArray(value) ? value[0] || fallback : value || fallback;

const asNumber = (value, fallback = null) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const getTitle = (item) => item?.name || item?.title || item?.project_name || "Untitled Project";

const getLocation = (item) => [
    item?.area,
    item?.city,
    item?.state,
].filter(Boolean).join(", ") || item?.location || item?.address || "Location not available";

const getCoverImage = (item) => (
    item?.media?.find((media) => media.is_cover && media.media_type === "image")?.url
    || item?.media?.find((media) => media.media_type === "image")?.url
    || item?.cover_image_url
    || item?.cover_image
    || item?.image
);

const formatPrice = (item) => {
    const basePrice = Number(item?.base_price || item?.selling_price || 0);
    const priceFrom = Number(item?.price_from || item?.min_price || basePrice || 0);
    const priceTo = Number(item?.price_to || item?.max_price || basePrice || 0);

    if (priceFrom && priceTo && priceTo > priceFrom) {
        return `Rs ${(priceFrom / 100000).toFixed(2)}L - Rs ${(priceTo / 100000).toFixed(2)}L`;
    }

    const price = priceFrom || priceTo || basePrice;
    return price ? `Rs ${(price / 100000).toFixed(2)}L` : "Price not set";
};

const formatDistance = (item) => {
    const distance = Number(item?.distance_km ?? item?.distance);
    return Number.isFinite(distance) ? `${distance.toFixed(1)} km away` : null;
};

const ProjectCard = React.memo(({ item, onSelect }) => {
    const coverImage = getCoverImage(item);
    const distance = formatDistance(item);
    const projectType = item.project_launch_status || item.status || (item.is_active ? "active" : null);

    const handlePress = useCallback(() => {
        onSelect(item);
    }, [item, onSelect]);

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePress}
            className="flex-row bg-white border border-gray-200 rounded-xl p-3 mb-3"
        >
            {coverImage ? (
                <Image
                    source={{ uri: coverImage }}
                    className="w-24 h-24 rounded-lg bg-gray-100"
                    resizeMode="cover"
                />
            ) : (
                <View className="w-24 h-24 rounded-lg bg-gray-100 items-center justify-center">
                    <Ionicons name="business-outline" size={28} color="#9CA3AF" />
                </View>
            )}

            <View className="flex-1 ml-3">
                <View className="flex-row items-start justify-between gap-2">
                    <Text className="flex-1 text-sm font-lato-bold text-black" numberOfLines={1}>
                        {getTitle(item)}
                    </Text>
                    <Ionicons name="checkmark-circle-outline" size={19} color="#4A43EC" />
                </View>

                <View className="flex-row items-center mt-1">
                    <Ionicons name="location" size={13} color="#FE8A71" />
                    <Text className="flex-1 text-xs font-lato-medium text-gray-500 ml-1" numberOfLines={1}>
                        {getLocation(item)}
                    </Text>
                </View>

                <View className="flex-row flex-wrap gap-2 mt-2">
                    {projectType && (
                        <View className="px-2 py-1 rounded-full bg-[#F0EFFD]">
                            <Text className="text-[10px] font-lato-bold text-[#4A43EC] capitalize">
                                {projectType}
                            </Text>
                        </View>
                    )}
                    {distance && (
                        <View className="px-2 py-1 rounded-full bg-gray-100">
                            <Text className="text-[10px] font-lato-medium text-gray-600">
                                {distance}
                            </Text>
                        </View>
                    )}
                </View>

                <Text className="text-sm font-lato-bold text-[#4A43EC] mt-2" numberOfLines={1}>
                    {formatPrice(item)}
                </Text>
            </View>
        </TouchableOpacity>
    );
});

ProjectCard.displayName = "ProjectCard";

export default function NearbyProjects() {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const params = useLocalSearchParams();
    const latitude = asNumber(firstParam(params.latitude));
    const longitude = asNumber(firstParam(params.longitude));
    const radius = asNumber(firstParam(params.radius), DEFAULT_RADIUS);
    const nearbyProjects = useSelector((state) => state.property.nearbyProjects);
    const nearbyProjectsLoading = useSelector((state) => state.property.nearbyProjectsLoading);
    const error = useSelector((state) => state.property.error);

    const loadNearbyProjects = useCallback(() => {
        if (latitude === null || longitude === null) return;
        dispatch(fetchNearbyProjects({ latitude, longitude, radius }));
    }, [dispatch, latitude, longitude, radius]);

    useEffect(() => {
        loadNearbyProjects();
    }, [loadNearbyProjects]);

    const handleBack = useCallback(() => {
        router.back();
    }, []);

    const handleSelect = useCallback((item) => {
        dispatch(pickNearbyProject({
            id: item.id,
            name: getTitle(item),
            address: getLocation(item),
            latitude: item.latitude ?? null,
            longitude: item.longitude ?? null,
            raw: item,
        }));
        router.back();
    }, [dispatch]);

    const renderProject = useCallback(({ item }) => (
        <ProjectCard item={item} onSelect={handleSelect} />
    ), [handleSelect]);

    const keyExtractor = useCallback((item, index) => String(item.id || item.slug || index), []);

    const contentContainerStyle = useMemo(() => ({
        paddingBottom: insets.bottom + 28,
        flexGrow: 1,
    }), [insets.bottom]);

    const listEmptyComponent = useMemo(() => (
        <View className="flex-1 items-center justify-center py-16">
            <View className="w-14 h-14 rounded-2xl bg-white border border-gray-200 items-center justify-center mb-3">
                <Ionicons name="heart-outline" size={24} color="#4A43EC" />
            </View>
            <Text className="text-sm font-lato-bold text-black">
                {error ? "Nearby projects unavailable" : "No nearby projects found"}
            </Text>
            <Text className="text-xs font-lato-medium text-gray-500 mt-1 text-center px-8">
                {error || "Try selecting a different property location."}
            </Text>
            {error && (
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={loadNearbyProjects}
                    className="mt-4 bg-[#4A43EC] rounded-xl px-5 py-3"
                >
                    <Text className="text-xs font-lato-bold text-white">Retry</Text>
                </TouchableOpacity>
            )}
        </View>
    ), [error, loadNearbyProjects]);

    return (
        <View className="flex-1 bg-[#F8F9FE]" style={{ paddingTop: insets.top }}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FE" />

            <View className="flex-row items-center justify-between px-5 py-4">
                <Pressable onPress={handleBack} className="p-1">
                    <Ionicons name="arrow-back" size={21} color="#111" />
                </Pressable>
                <Text className="text-base font-lato-bold text-black">Nearby Projects</Text>
                <View style={{ width: 24 }} />
            </View>

            <View className="px-5 pb-3">
                <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <View className="w-9 h-9 rounded-xl bg-[#F0EFFD] items-center justify-center mr-3">
                        <Ionicons name="navigate" size={18} color="#4A43EC" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-sm font-lato-bold text-black">Squarft nearby projects</Text>
                        <Text className="text-xs font-lato-medium text-gray-500 mt-0.5">
                            Within {radius} km of selected property location
                        </Text>
                    </View>
                </View>
            </View>

            {nearbyProjectsLoading && nearbyProjects.length === 0 ? (
                <View className="flex-1 items-center justify-center px-5">
                    <ActivityIndicator color="#4A43EC" />
                    <Text className="text-xs font-lato-medium text-gray-500 mt-3">Loading nearby projects...</Text>
                </View>
            ) : (
                <FlatList
                    className="flex-1 px-5"
                    data={nearbyProjects}
                    keyExtractor={keyExtractor}
                    renderItem={renderProject}
                    showsVerticalScrollIndicator={false}
                    alwaysBounceVertical={true}
                    refreshControl={
                        <RefreshControl refreshing={nearbyProjectsLoading} onRefresh={loadNearbyProjects} colors={["#4A43EC"]} tintColor="#4A43EC" />
                    }
                    contentContainerStyle={contentContainerStyle}
                    ListEmptyComponent={listEmptyComponent}
                    maxToRenderPerBatch={8}
                    windowSize={5}
                    initialNumToRender={6}
                    removeClippedSubviews={Platform.OS === 'android'}
                />
            )}
        </View>
    );
}
