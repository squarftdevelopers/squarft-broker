import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StatusBar, Text, TextInput, TouchableOpacity, View, RefreshControl } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { fetchCommissionHistory } from "../../store/slices/walletSlice";
import CommissionFilterModal from "../../components/CommissionFilterModal";

const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatAmount = (amount) =>
    `\u20B9${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

function CommissionCard({ item }) {
    const status = item.status || "CREDIT";
    const title = item.propertyName || "Commission Earned";
    const location = item.propertyAddress || "Property commission";

    // Detect if status is pending
    const isPending = String(status).trim().toLowerCase() === "pending";

    return (
        <View className="bg-white rounded-2xl mb-4 px-4 py-4 border border-1.5 border-[#E5E7EB]">
            <View className="flex-row items-start justify-between mb-1">
                <Text className="text-[15px] font-lato-bold text-[#1a1a1a] flex-1 mr-2" numberOfLines={1}>
                    {title}
                </Text>
                {/* FIXED: Dynamic background color changes pending to #ef8844ff while keeping white text */}
                <View 
                    className="px-5 py-0.5 rounded-full"
                    style={{ backgroundColor: isPending ? "#ef8844ff" : "#1E9500" }}
                >
                    <Text className="text-white text-[10px] font-roboto-medium">{status}</Text>
                </View>
            </View>

            <View className="flex-row items-center mb-5 mt-1">
                <FontAwesome6 name="location-dot" size={15} color="#4A43EC" />
                <Text className="text-[12px] text-gray-500 ml-2 font-lato flex-1" numberOfLines={1}>
                    {location}
                </Text>
            </View>

            <View className="flex-row items-center justify-between">
                {/* FIXED: Changes amount text color dynamically if item status is pending */}
                <Text 
                    className="text-[16px] font-lato-medium"
                    style={{ color: isPending ? "#ef8844ff" : "#1E9500" }}
                >
                    {isPending ? "" : "+"}{formatAmount(item.amount)}
                </Text>
                <Text className="text-[12px] text-gray-400 font-roboto italic">
                    {formatDate(item.createdAt)}
                </Text>
            </View>
        </View>
    );
}

export default function Discount() {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const router = useRouter();
    const unwatchedCount = useSelector(state => state.notifications?.list?.filter(n => !n.watched).length || 0);
    const { commissions, loading, error } = useSelector((state) => state.wallet);
    const [search, setSearch] = useState("");
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await dispatch(fetchCommissionHistory({ page: 1, limit: 100 }));
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        console.log('🔍 [discount.jsx] Fetching commission history...');
        dispatch(fetchCommissionHistory({ page: 1, limit: 100 }));
    }, [dispatch]);

    const hasActiveFilters = statusFilter !== 'all' || dateFilter !== 'all';

    const filtered = useMemo(() => {
        if (!Array.isArray(commissions)) return [];
        
        let result = [...commissions];

        // Search filter
        if (search) {
            const query = search.trim().toLowerCase();
            result = result.filter((item) =>
                (item.propertyName || "").toLowerCase().includes(query) ||
                (item.propertyAddress || "").toLowerCase().includes(query) ||
                String(item.amount || "").includes(query)
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(item => {
                const itemStatus = (item.status || 'credit').toLowerCase();
                // Map 'paid' filter to 'credit' status in data
                if (statusFilter === 'paid') {
                    return itemStatus === 'credit' || itemStatus === 'paid' || itemStatus === 'completed';
                }
                return itemStatus === statusFilter.toLowerCase();
            });
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const cutoffDate = new Date();
            
            if (dateFilter === 'month') {
                cutoffDate.setMonth(now.getMonth() - 1);
            } else if (dateFilter === '3months') {
                cutoffDate.setMonth(now.getMonth() - 3);
            } else if (dateFilter === '6months') {
                cutoffDate.setMonth(now.getMonth() - 6);
            }
            
            result = result.filter(item => {
                if (!item.createdAt) return false;
                const itemDate = new Date(item.createdAt);
                return itemDate >= cutoffDate;
            });
        }

        return result;
    }, [commissions, search, statusFilter, dateFilter]);

    const handleApplyFilters = (filters) => {
        console.log('📊 [discount.jsx] Filters applied:', filters);
        setStatusFilter(filters.status);
        setDateFilter(filters.dateFilter);
        setFilterModalVisible(false);
    };

    const retry = () => {
        dispatch(fetchCommissionHistory({ page: 1, limit: 100 }));
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View className="flex-row items-center justify-between px-5 pb-3" style={{ paddingTop: insets.top + 8 }}>
                <View />
                <Text className="text-[16px] text-black font-lato-bold ml-8">Commission History</Text>
                <TouchableOpacity
                    className="p-1 relative"
                    onPress={() => router.push("/notifications")}
                >
                    <Ionicons name="notifications" size={22} color="black" />
                    {unwatchedCount > 0 ? (
                        <View className="absolute top-0 right-0 bg-[#FF3B30] min-w-[14px] h-[14px] rounded-full items-center justify-center border border-white">
                            <Text className="text-white text-[8px] font-manrope-bold">{unwatchedCount}</Text>
                        </View>
                    ) : null}
                </TouchableOpacity>
            </View>

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
                    onPress={() => {
                        console.log('🎯 [discount.jsx] Filter button pressed');
                        setFilterModalVisible(true);
                    }}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name="filter-variant" size={22} color="#4A43EC" />
                    {hasActiveFilters && (
                        <View className="absolute top-1 right-1 w-2 h-2 bg-[#FF3B30] rounded-full" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Filter Modal */}
            <CommissionFilterModal
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                onApplyFilters={handleApplyFilters}
                initialStatus={statusFilter}
                initialDateFilter={dateFilter}
            />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4A43EC" />
                </View>
            ) : error ? (
                <View className="flex-1 items-center justify-center px-10">
                    <MaterialCommunityIcons name="cash-remove" size={56} color="#D1D5DB" />
                    <Text className="text-gray-400 text-[14px] font-manrope-medium mt-4 text-center">{error}</Text>
                    <TouchableOpacity
                        onPress={retry}
                        className="bg-[#4A43EC] px-5 py-3 rounded-xl mt-5"
                    >
                        <Text className="text-white text-[12px] font-manrope-bold">Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <CommissionCard item={item} />}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140, paddingTop: 10, flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    alwaysBounceVertical={true}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#4A43EC"]}
                            tintColor="#4A43EC"
                        />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center px-10">
                            <MaterialCommunityIcons name="cash-remove" size={56} color="#D1D5DB" />
                            <Text className="text-gray-400 text-[14px] font-manrope-medium mt-4 text-center">
                                {search ? "No commissions match your search" : "No commission history yet"}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}