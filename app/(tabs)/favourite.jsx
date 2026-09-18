import { View, Text, FlatList, TextInput, TouchableOpacity, Image, Modal, StatusBar, ActivityIndicator, Alert } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useState, useEffect, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { fetchMyAddedProperties, deleteProperty, fetchPropertyDetails } from "../../store/slices/myAddedSlice";
import PropertyDetailSheet from "../../components/property/PropertyDetailSheet";
import DynamicPropertyImage from "../../components/property/DynamicPropertyImage";
import FilterModal from "../../components/FilterModal";

const DEFAULT_BUDGET_RANGE = [2000000, 50000000];

const isDefaultBudgetRange = (range) => (
    Array.isArray(range) &&
    Number(range[0]) === DEFAULT_BUDGET_RANGE[0] &&
    Number(range[1]) === DEFAULT_BUDGET_RANGE[1]
);

const hasSelectedFilters = (filters) => {
    if (!filters) return false;

    return Boolean(
        filters.category ||
        filters.propertyTypes?.length ||
        filters.bhks?.length ||
        (filters.budgetRange && !isDefaultBudgetRange(filters.budgetRange))
    );
};

const buildMyAddedFilters = ({ search, filters }) => {
    const backendFilters = {};
    const searchText = search.trim();

    if (searchText) backendFilters.search = searchText;
    if (!filters) return backendFilters;

    if (filters.category) backendFilters.category = filters.category;
    if (filters.propertyTypes?.length) {
        backendFilters.property_type = filters.propertyTypes.join(",");
    }
    if (filters.bhks?.length) {
        backendFilters.bhk_type = filters.bhks.join(",");
    }
    if (filters.budgetRange && !isDefaultBudgetRange(filters.budgetRange)) {
        backendFilters.min_price = filters.budgetRange[0];
        backendFilters.max_price = filters.budgetRange[1];
    }

    return backendFilters;
};

function PropertyCard({ item, onDeletePress, onEditPress, onPress }) {
    const [menuOpen, setMenuOpen] = useState(false);
    
    // Get cover image from media array
    const coverImage = item.media?.find(m => m.is_cover && m.media_type === 'image')?.url || 
                       item.media?.find(m => m.media_type === 'image')?.url ||
                       item.cover_image_url;
    
    // Format location - show city only (area field contains "TBD" or locality name)
    const location = item.city || 'Location not set';
    
    // Format price - show exact value without conversion or units
    const rawPrice = item.selling_price ?? item.price ?? item.base_price ?? item.price_from ?? item.min_price;
    const priceFrom = item.price_from || item.min_price;
    const priceTo = item.price_to || item.max_price;
    const formatExact = (val) => {
        if (val === undefined || val === null || val === '') return '';
        const cleaned = String(val).replace(/[^\d.]/g, '').trim();
        const num = Number(cleaned);
        if (Number.isFinite(num) && num > 0) {
            return `\u20B9${num.toLocaleString('en-IN')}`;
        }
        return cleaned ? `\u20B9${cleaned}` : '';
    };
    const priceDisplay = (priceTo && priceFrom && Number(String(priceTo).replace(/[^\d.]/g, '')) > Number(String(priceFrom).replace(/[^\d.]/g, '')))
        ? `${formatExact(priceFrom)} - ${formatExact(priceTo)}`
        : (rawPrice !== undefined && rawPrice !== null && rawPrice !== '' && rawPrice !== 0 && rawPrice !== '0')
            ? formatExact(rawPrice)
            : 'Price not set';

    // Property name - backend normalizes projects to have 'title' field, properties have 'title' natively
    const propertyName = item.name || item.title || 'Untitled Property';
    
    // Category - backend returns 'type' field for properties, projects have 'category'
    const category = item.type || item.category || 'Property';
    
    // Total area - use total_area_sqft field, not 'area' (which is locality name)
    const totalArea = item.total_area_sqft || item.total_area;

    const handleEdit = () => {
        console.log('[PropertyCard] Edit button pressed for item:', item.id);
        setMenuOpen(false);
        onEditPress?.(item);
    };

    const handleDelete = () => {
        console.log('[PropertyCard] Delete button pressed for item:', item.id);
        setMenuOpen(false);
        onDeletePress?.(item.id);
    };

    const toggleMenu = () => {
        console.log('≡ƒöÿ [PropertyCard] Toggling menu, current:', menuOpen);
        setMenuOpen(prev => !prev);
    };

    return (
        <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => !menuOpen && onPress?.(item)}
            className="flex-row bg-white border border-[#E5E7EB] rounded-[20px] mb-4 p-3 items-start"
        >
            <DynamicPropertyImage uri={coverImage} style={{ width: 108, height: 105, borderRadius: 16 }} label="No property image" />
            <View className="flex-1 ml-2.5">
                <View className="flex-row items-center mb-0.5">
                    <View className="w-[7px] h-[7px] rounded-full bg-[#4A43EC] mr-1" />
                    <Text className="text-[10px] text-[#4A43EC] italic capitalize">{category}</Text>
                </View>
                <Text className="text-[14px] font-roboto-medium text-[#1a1a1a] mb-0.5" numberOfLines={1}>
                    {propertyName}
                </Text>
                <View className="flex-row items-center mb-0.5">
                    <Ionicons name="location" size={13} color="#FE8A71" />
                    <Text className="text-[10px] tracking-wide font-roboto text-gray-500 ml-1" numberOfLines={1}>{location}</Text>
                </View>
                <View className="flex-row gap-2.5 mb-1">
                    {totalArea && (
                        <View className="flex-row items-center gap-1.5">
                            <MaterialCommunityIcons name="floor-plan" size={13} color="#FE8A71" />
                            <Text className="text-[10px] italic text-gray-500">{totalArea} {item.area_unit || 'sqft'}</Text>
                        </View>
                    )}
                    {(item.sub_type || item.property_subtype) && (
                        <View className="flex-row items-center gap-1.5">
                            <MaterialCommunityIcons name="bed" size={13} color="#FE8A71" />
                            <Text className="text-[10px] italic text-gray-500">{item.sub_type || item.property_subtype}</Text>
                        </View>
                    )}
                </View>
                <Text className="text-[16px] font-bold text-[#4F46E5]">
                    {priceDisplay}
                </Text>
            </View>

            {/* 3-dot menu */}
            <View className="items-end">
                <TouchableOpacity 
                    className="p-2.5" 
                    onPress={toggleMenu}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.6}
                >
                    <Feather name="more-vertical" size={18} color="#333" />
                </TouchableOpacity>
                {menuOpen && (
                    <View 
                        className="absolute top-10 right-0 bg-[#4F46E5] rounded-xl overflow-hidden shadow-2xl" 
                        style={{ 
                            elevation: 30, 
                            minWidth: 130,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.5,
                            shadowRadius: 15,
                        }}
                    >
                        <TouchableOpacity
                            className="flex-row items-center gap-2.5 px-4 py-3.5 border-b border-[#6B63F0]"
                            onPress={handleEdit}
                            activeOpacity={0.6}
                            style={{ backgroundColor: '#4F46E5' }}
                        >
                            <Feather name="edit-2" size={16} color="#fff" />
                            <Text className="text-white text-[14px] font-roboto-medium">Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-row items-center gap-2.5 px-4 py-3.5"
                            onPress={handleDelete}
                            activeOpacity={0.6}
                            style={{ backgroundColor: '#4F46E5' }}
                        >
                            <Feather name="trash-2" size={16} color="#fff" />
                            <Text className="text-white text-[14px] font-roboto-medium">Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

export default function Favourite() {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const router = useRouter();
    const properties = useSelector((state) => state.myAdded.list);
    const loading = useSelector((state) => state.myAdded.loading);
    const unwatchedCount = useSelector(state => state.notifications?.list?.filter(n => !n.watched && !n.is_read).length || 0);
    const [search, setSearch] = useState("");
    const [deleteId, setDeleteId] = useState(null);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [propertySheetVisible, setPropertySheetVisible] = useState(false);
    const [propertyDetailLoading, setPropertyDetailLoading] = useState(false);
    const [propertyDetailError, setPropertyDetailError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [activeFilters, setActiveFilters] = useState(null);
    const detailRequestRef = useRef(0);

    // Fetch properties on mount (no filters initially)
    useEffect(() => {
        dispatch(fetchMyAddedProperties());
    }, [dispatch]);

    // Refresh properties every time the screen comes into focus
    // AND reset filters to show all properties
    useFocusEffect(
        useCallback(() => {
            console.log('≡ƒöä [favourite.jsx] Tab focused - Resetting filters and refreshing');
            // Clear filters
            setActiveFilters(null);
            setSearch("");
            // Fetch all properties without filters
            dispatch(fetchMyAddedProperties());
        }, [dispatch])
    );

    // Debounced search - fetch from backend when search changes
    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(fetchMyAddedProperties(buildMyAddedFilters({ search, filters: activeFilters })));
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [search, dispatch, activeFilters]);

    const handleApplyFilters = (filters) => {
        console.log('≡ƒöì [favourite.jsx] Filters received from modal:', filters);
        const nextActiveFilters = hasSelectedFilters(filters) ? filters : null;
        const backendFilters = buildMyAddedFilters({ search, filters: nextActiveFilters });
        
        setActiveFilters(nextActiveFilters);
        console.log('≡ƒöì [favourite.jsx] Backend filters being sent:', backendFilters);
        dispatch(fetchMyAddedProperties(backendFilters));
    };

    const handleConfirmDelete = async () => {
        console.log('[favourite.jsx] handleConfirmDelete called with deleteId:', deleteId);
        setDeleting(true);
        try {
            await dispatch(deleteProperty(deleteId)).unwrap();
            console.log('[favourite.jsx] Delete successful');
            setDeleteId(null);
        } catch (error) {
            console.error('[favourite.jsx] Delete failed:', error);
            alert('Failed to delete. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const handleEditPress = (item) => {
        console.log('[favourite.jsx] handleEditPress called with item:', item);
        dispatch(fetchPropertyDetails(item.id))
            .unwrap()
            .then(() => {
                console.log('[favourite.jsx] Details fetched, navigating to edit form');
                router.push({
                    pathname: '/(tabs)/addProperty',
                    params: { itemId: item.id, mode: 'edit' }
                });
            })
            .catch((error) => {
                console.error('[favourite.jsx] Failed to load details:', error);
                Alert.alert('Error', `Failed to load details: ${error}`);
            });
    };

    const handlePropertyPress = useCallback((item) => {
        if (!item?.id) return;

        const requestId = detailRequestRef.current + 1;
        detailRequestRef.current = requestId;
        setSelectedProperty(item);
        setPropertySheetVisible(true);
        setPropertyDetailLoading(true);
        setPropertyDetailError(null);

        dispatch(fetchPropertyDetails(item.id))
            .unwrap()
            .then((details) => {
                if (detailRequestRef.current !== requestId) return;
                setSelectedProperty({
                    ...item,
                    ...details,
                    item_type: details?.item_type || item.item_type,
                });
            })
            .catch((error) => {
                if (detailRequestRef.current !== requestId) return;
                const message = typeof error === 'string' ? error : error?.message || 'Failed to load property details';
                setPropertyDetailError(message);
            })
            .finally(() => {
                if (detailRequestRef.current === requestId) {
                    setPropertyDetailLoading(false);
                }
            });
    }, [dispatch]);

    const handleClosePropertySheet = useCallback(() => {
        detailRequestRef.current += 1;
        setPropertySheetVisible(false);
        setPropertyDetailLoading(false);
        setPropertyDetailError(null);
    }, []);

    if (loading && properties.length === 0) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#4A43EC" />
                <Text className="text-gray-500 mt-4 font-lato-regular">Loading properties...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pb-3" style={{ paddingTop: insets.top + 8 }}>
                <View />
                <Text className="text-[16px] text-black font-lato-bold ml-8">My Added</Text>
                <TouchableOpacity
                    className="p-1 relative"
                    onPress={() => router.push("/(screens)/notifications")}
                >
                    <Ionicons name="notifications" size={22} color="black" />
                    {unwatchedCount > 0 ? (
                        <View className="absolute top-0 right-0 bg-[#FF3B30] min-w-[14px] h-[14px] rounded-full items-center justify-center border border-white">
                            <Text className="text-white text-[8px] font-manrope-bold">{unwatchedCount}</Text>
                        </View>
                    ) : null}
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="flex-row px-5 mt-3 gap-2.5 mb-5">
                <View className="flex-1 flex-row items-center bg-[#EBF1FF] rounded-xl px-3.5 h-[44px]">
                    <Ionicons name="search" size={18} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 text-[13px] text-black ml-2 font-lato-regular"
                        placeholder="Search"
                        placeholderTextColor="#9CA3AF"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <TouchableOpacity 
                    className="w-[44px] h-[44px] bg-[#EBF1FF] rounded-xl items-center justify-center relative"
                    onPress={() => setFilterModalVisible(true)}
                >
                    <MaterialCommunityIcons name="filter-variant" size={22} color="#4A43EC" />
                    {activeFilters && (
                        <View className="absolute top-1 right-1 w-2 h-2 bg-[#FF3B30] rounded-full" />
                    )}
                </TouchableOpacity>
            </View>

            {/* List */}
            {properties.length === 0 && !loading ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="folder-open-outline" size={64} color="#D1D5DB" />
                    <Text className="text-gray-400 font-lato-medium text-center text-sm mt-4">
                        {search || activeFilters ? 'No properties match your filters' : 'No properties added yet'}
                    </Text>
                    <Text className="text-gray-400 font-lato-regular text-center text-xs mt-2">
                        {!search && !activeFilters && 'Add properties from the Add Property tab'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={properties}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <PropertyCard 
                            item={item} 
                            onDeletePress={setDeleteId}
                            onEditPress={handleEditPress}
                            onPress={handlePropertyPress}
                        />
                    )}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 150, paddingTop: 10 }}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Delete Confirm Modal */}
            <Modal visible={deleteId !== null} transparent animationType="fade">
                <View className="flex-1 justify-center items-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                    <View className="bg-white rounded-3xl mx-6 px-6 py-8 w-[85%]" style={{ elevation: 10 }}>
                        <Text className="text-[18px] font-roboto-bold text-[#1a1a1a] text-center mb-8">
                            Are you sure you want to{"\n"}delete this property?
                        </Text>
                        <View className="flex-row gap-4">
                            <TouchableOpacity
                                className="flex-1 py-3.5 rounded-2xl items-center justify-center border-2 border-[#4F46E5]"
                                onPress={() => setDeleteId(null)}
                                disabled={deleting}
                            >
                                <Text className="text-[#4F46E5] text-[15px] font-roboto-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 py-3.5 rounded-2xl items-center justify-center bg-[#E53935]"
                                onPress={handleConfirmDelete}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text className="text-white text-[15px] font-roboto-bold">Delete</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <PropertyDetailSheet 
                visible={propertySheetVisible}
                item={selectedProperty}
                loading={propertyDetailLoading}
                error={propertyDetailError}
                onClose={handleClosePropertySheet}
            />

            <FilterModal 
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                onApplyFilters={handleApplyFilters}
            />
        </View>
    );
}
