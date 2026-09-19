import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Platform,
    Pressable,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
    clearLocationResults,
    pickLocation,
    reverseGeocodeLocation,
    searchLocations,
    setLocationResults,
} from "../../store/slices/locationSlice";
import {
    geocodeGoogleAddress,
    reverseGeocodeGoogleLocation,
    searchGoogleLocations,
} from "../../utils/googleMaps";

const firstParam = (value, fallback = "") => Array.isArray(value) ? value[0] || fallback : value || fallback;
const getShortAddress = (address = "") => address.split(",").slice(0, 2).join(",").trim() || address;
const DEFAULT_REGION = {
    latitude: 22.7196,
    longitude: 75.8577,
    latitudeDelta: 0.018,
    longitudeDelta: 0.018,
};
const asCoordinate = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const getLocationAddress = (location) => (
    location?.address
    || location?.formatted_address
    || location?.display_name
    || location?.name
    || ""
);

const compactAddress = (parts) => parts.filter(Boolean).join(", ");

const getDeviceLocationResult = async ({ latitude, longitude }) => {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!address) return null;

    const area = address.district || address.subregion || address.street || address.name || null;
    const city = address.city || address.subregion || null;
    const state = address.region || null;
    const pincode = address.postalCode || null;
    const formattedAddress = compactAddress([
        address.name,
        address.street,
        address.district,
        address.city,
        address.region,
        address.postalCode,
        address.country,
    ]);

    return {
        address: formattedAddress,
        latitude,
        longitude,
        area,
        city,
        state,
        pincode,
        provider: "expo-location",
    };
};

const LocationItem = React.memo(({ item, isSelected, onSelect }) => {
    const handlePress = useCallback(() => {
        onSelect(item);
    }, [item, onSelect]);

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePress}
            className={`flex-row rounded-xl border px-4 py-3 mb-3 ${isSelected ? "border-[#4A43EC] bg-[#F4F7FF]" : "border-gray-200 bg-white"}`}
        >
            <View className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${isSelected ? "bg-[#d2d0fa]" : "bg-gray-100"}`}>
                <Ionicons name="location" size={17} color={isSelected ? "#4A43EC" : "#777"} />
            </View>
            <View className="flex-1">
                <Text className="text-sm font-lato-bold text-black" numberOfLines={1}>
                    {getShortAddress(item.address)}
                </Text>
                <Text className="text-xs font-lato-medium text-gray-500 mt-1" numberOfLines={2}>
                    {item.address}
                </Text>
            </View>
            {isSelected && (
                <Ionicons name="checkmark-circle" size={20} color="#4A43EC" />
            )}
        </TouchableOpacity>
    );
});

LocationItem.displayName = "LocationItem";

export default function LocationPicker() {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const params = useLocalSearchParams();
    const target = firstParam(params.target, "owner_address");
    const title = firstParam(params.title, "Select Location");
    const initialAddress = firstParam(params.initialAddress);
    const initialLatitude = asCoordinate(firstParam(params.initialLatitude));
    const initialLongitude = asCoordinate(firstParam(params.initialLongitude));
    const results = useSelector((state) => state.location.results);
    const loading = useSelector((state) => state.location.loading);
    const error = useSelector((state) => state.location.error);
    const mapRef = useRef(null);

    const [query, setQuery] = useState(String(initialAddress || ""));
    const [selected, setSelected] = useState(null);
    const [mapRegion, setMapRegion] = useState(() => ({
        ...DEFAULT_REGION,
        latitude: initialLatitude || DEFAULT_REGION.latitude,
        longitude: initialLongitude || DEFAULT_REGION.longitude,
    }));
    const [locating, setLocating] = useState(false);

    const canUseManual = query.trim().length > 0;

    const handleBack = useCallback(() => {
        router.back();
    }, []);
    
    useEffect(() => {
        dispatch(clearLocationResults());
        
        // Request location permission on mount to enable "showsUserLocation"
        (async () => {
            try {
                console.log('📍 Requesting location permission...');
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    console.log('✅ Location permission granted');
                } else {
                    console.log('❌ Location permission denied');
                }
            } catch (permError) {
                console.error('❌ Error requesting location permission:', permError);
            }
        })();
    }, [dispatch]);

    const handleSearch = useCallback(async () => {
        const cleanQuery = query.trim();
        if (cleanQuery.length < 3) {
            Alert.alert("Location", "Enter at least 3 characters to search.");
            return;
        }

        try {
            const googleResults = await searchGoogleLocations(cleanQuery);
            dispatch(setLocationResults(googleResults));
            setSelected(null);
        } catch (searchError) {
            try {
                const fallbackResults = await dispatch(searchLocations({ query: cleanQuery })).unwrap();
                if (fallbackResults.length > 0) {
                    dispatch(setLocationResults(fallbackResults));
                    setSelected(null);
                    return;
                }
            } catch (_) {
                // Show the original backend error below.
            }

            Alert.alert("Location", searchError || "Unable to search locations.");
        }
    }, [query, dispatch]);

    const handleLocateMe = useCallback(async () => {
        try {
            setLocating(true);
            console.log('📍 Starting location fetch...');
            
            const permission = await Location.requestForegroundPermissionsAsync();
            console.log('📍 Permission status:', permission.status);
            
            if (permission.status !== "granted") {
                Alert.alert(
                    "Location Permission Required", 
                    "Please enable location permission in your device settings to use this feature.",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Open Settings", onPress: () => {
                            // For Android, this will open app settings
                            if (Platform.OS === 'android') {
                                Linking.openSettings();
                            }
                        }}
                    ]
                );
                return;
            }

            console.log('📍 Fetching current position...');
            const currentPosition = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 5000,
                distanceInterval: 10,
            });
            
            console.log('✅ Current position:', currentPosition.coords);
            
            const nextRegion = {
                ...mapRegion,
                latitude: currentPosition.coords.latitude,
                longitude: currentPosition.coords.longitude,
                latitudeDelta: 0.014,
                longitudeDelta: 0.014,
            };

            setMapRegion(nextRegion);
            mapRef.current?.animateToRegion(nextRegion, 300);
            setSelected(null);
        } catch (locateError) {
            console.error('❌ Location error:', locateError);
            Alert.alert(
                "Location Error", 
                "Unable to fetch your current location. Please ensure:\n\n1. Location is enabled in device settings\n2. You have granted location permission\n3. You are not in airplane mode"
            );
        } finally {
            setLocating(false);
        }
    }, [mapRegion]);

    const getCurrentMapCenter = useCallback(async () => {
        try {
            const camera = await mapRef.current?.getCamera?.();
            const cameraLatitude = asCoordinate(camera?.center?.latitude);
            const cameraLongitude = asCoordinate(camera?.center?.longitude);

            if (cameraLatitude !== null && cameraLongitude !== null) {
                return {
                    ...mapRegion,
                    latitude: cameraLatitude,
                    longitude: cameraLongitude,
                };
            }
        } catch (_) {
            // Fall back to the last completed region update.
        }

        return mapRegion;
    }, [mapRegion]);

    const buildPickedLocation = useCallback((location, region = mapRegion) => ({
        target,
        address: getLocationAddress(location) || `${region.latitude.toFixed(6)}, ${region.longitude.toFixed(6)}`,
        latitude: region.latitude,
        longitude: region.longitude,
        city: location?.city ?? selected?.city ?? null,
        state: location?.state ?? selected?.state ?? null,
        pincode: location?.pincode ?? selected?.pincode ?? null,
        area: location?.area ?? selected?.area ?? null,
    }), [target, mapRegion, selected]);

    const handleUseMapCenter = useCallback(async () => {
        if (!mapRegion) return;

        const centerRegion = await getCurrentMapCenter();
        setMapRegion(centerRegion);

        let resolvedLocation = null;

        try {
            resolvedLocation = await reverseGeocodeGoogleLocation({
                latitude: centerRegion.latitude,
                longitude: centerRegion.longitude,
            });
        } catch (_) {
            try {
                resolvedLocation = await dispatch(reverseGeocodeLocation(centerRegion)).unwrap();
            } catch (_) {
                try {
                    resolvedLocation = await getDeviceLocationResult(centerRegion);
                } catch (_) {
                    resolvedLocation = null;
                }
            }
        }

        dispatch(pickLocation(buildPickedLocation(resolvedLocation, centerRegion)));
        router.back();
    }, [mapRegion, getCurrentMapCenter, dispatch, buildPickedLocation]);

    const handleUseTypedAddress = useCallback(async () => {
        const cleanAddress = query.trim();
        if (!cleanAddress) return;

        try {
            setLocating(true);
            const location = await geocodeGoogleAddress(cleanAddress);
            dispatch(pickLocation({ target, ...location, address: cleanAddress }));
            router.back();
        } catch (typedAddressError) {
            Alert.alert(
                "Address not found",
                typedAddressError.message || "Enter a more complete address so nearby projects can be located.",
            );
        } finally {
            setLocating(false);
        }
    }, [query, target, dispatch]);

    const handleSelectItem = useCallback((item) => {
        setSelected(item);
        setQuery(getLocationAddress(item));
        const itemLatitude = asCoordinate(item.latitude);
        const itemLongitude = asCoordinate(item.longitude);
        if (itemLatitude !== null && itemLongitude !== null) {
            const nextRegion = {
                ...mapRegion,
                latitude: itemLatitude,
                longitude: itemLongitude,
                latitudeDelta: 0.014,
                longitudeDelta: 0.014,
            };

            setMapRegion(nextRegion);
            mapRef.current?.animateToRegion(nextRegion, 300);
        }
    }, [mapRegion]);

    const handleRegionChangeComplete = useCallback((region) => {
        setMapRegion(region);
    }, []);

    const handlePanDrag = useCallback(() => {
        setSelected(null);
    }, []);

    const renderLocation = useCallback(({ item }) => (
        <LocationItem
            item={item}
            isSelected={selected?.id === item.id}
            onSelect={handleSelectItem}
        />
    ), [selected?.id, handleSelectItem]);

    const keyExtractor = useCallback((item, index) => item.id ? String(item.id) : String(index), []);

    const listEmptyComponent = useMemo(() => (
        <View className="items-center justify-center py-16">
            <View className="w-14 h-14 rounded-2xl bg-white border border-gray-200 items-center justify-center mb-3">
                <Ionicons name="location-outline" size={24} color="#4A43EC" />
            </View>
            <Text className="text-sm font-lato-bold text-black">
                {error ? "Location unavailable" : "No location selected"}
            </Text>
            <Text className="text-xs font-lato-medium text-gray-500 mt-1 text-center px-8">
                {error || "Search for an address or use the typed address."}
            </Text>
        </View>
    ), [error]);

    const contentContainerStyle = useMemo(() => ({
        paddingBottom: insets.bottom + 28,
    }), [insets.bottom]);

    const confirmContainerStyle = useMemo(() => ({
        paddingBottom: insets.bottom + 16,
    }), [insets.bottom]);

    return (
        <View className="flex-1 bg-[#F8F9FE]" style={{ paddingTop: insets.top }}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FE" />

            <View className="flex-row items-center justify-between px-5 py-4">
                <Pressable onPress={handleBack} className="p-1">
                    <Ionicons name="arrow-back" size={21} color="#111" />
                </Pressable>
                <Text className="text-base font-lato-bold text-black">{title}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View className="px-5 pb-5">
                <View className="h-96 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 mb-4">
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={{ flex: 1 }}
                        initialRegion={mapRegion}
                        showsUserLocation={true}
                        showsMyLocationButton={false}
                        showsCompass={true}
                        showsScale={false}
                        loadingEnabled={true}
                        loadingIndicatorColor="#4A43EC"
                        loadingBackgroundColor="#F8F9FE"
                        moveOnMarkerPress={false}
                        onRegionChangeComplete={handleRegionChangeComplete}
                        onPanDrag={handlePanDrag}
                        onMapReady={() => {
                            console.log('✅ Map is ready');
                        }}
                        onError={(mapErr) => {
                            console.error('❌ Map error:', mapErr);
                        }}
                    />
                    <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
                        <View className="items-center" style={{ marginTop: -24 }}>
                            <Ionicons name="location-sharp" size={42} color="#4A43EC" />
                            <View className="w-5 h-2 rounded-full bg-black/20" />
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={handleLocateMe}
                        activeOpacity={0.85}
                        className="absolute right-3 bottom-3 w-11 h-11 rounded-xl bg-white items-center justify-center border border-gray-200"
                    >
                        {locating
                            ? <ActivityIndicator size="small" color="#4A43EC" />
                            : <Ionicons name="locate" size={20} color="#4A43EC" />
                        }
                    </TouchableOpacity>
                </View>

                <View className="flex-row bg-white border border-gray-200 rounded-xl px-4 py-2 items-center">
                    <Ionicons name="search" size={18} color="#4A43EC" />
                    <TextInput
                        className="flex-1 text-sm text-gray-800 font-lato-medium ml-2"
                        placeholder="Search address, landmark, city"
                        placeholderTextColor="#A0A0A0"
                        value={query}
                        onChangeText={setQuery}
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                    />
                    <TouchableOpacity
                        onPress={handleSearch}
                        activeOpacity={0.85}
                        className="w-9 h-9 rounded-xl bg-[#4A43EC] items-center justify-center"
                    >
                        {loading
                            ? <ActivityIndicator size="small" color="white" />
                            : <Ionicons name="arrow-forward" size={18} color="white" />
                        }
                    </TouchableOpacity>
                </View>

                <View className="flex-row gap-3 mt-4">
                    <TouchableOpacity
                        activeOpacity={canUseManual ? 0.85 : 1}
                        disabled={!canUseManual}
                        onPress={handleUseTypedAddress}
                        className={`flex-1 flex-row rounded-xl py-3 items-center justify-center ${canUseManual ? "bg-[#d2d0fa]" : "bg-gray-200"}`}
                    >
                        <Ionicons name="create" size={17} color={canUseManual ? "#4A43EC" : "#999"} />
                        <Text className={`text-xs font-lato-bold ml-2 ${canUseManual ? "text-[#4A43EC]" : "text-gray-500"}`}>
                            Use Typed Address
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleUseMapCenter}
                        className="flex-1 flex-row rounded-xl py-3 items-center justify-center bg-[#4A43EC]"
                    >
                        {loading
                            ? <ActivityIndicator size="small" color="white" />
                            : <Ionicons name="checkmark" size={17} color="white" />
                        }
                        <Text className="text-xs font-lato-bold text-white ml-2">
                            Use Map Center
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                className="flex-1 px-5"
                data={results}
                keyExtractor={keyExtractor}
                renderItem={renderLocation}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={contentContainerStyle}
                ListEmptyComponent={listEmptyComponent}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={8}
                removeClippedSubviews={Platform.OS === 'android'}
            />

            {selected && (
                <View className="px-5 py-4 bg-white border-t border-gray-100" style={confirmContainerStyle}>
                    <TouchableOpacity
                        onPress={handleUseMapCenter}
                        activeOpacity={0.85}
                        className="bg-[#4A43EC] rounded-xl py-4 items-center"
                    >
                        <Text className="text-white text-sm font-lato-bold">Confirm Location</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
