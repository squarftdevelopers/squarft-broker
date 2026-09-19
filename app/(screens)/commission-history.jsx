import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StatusBar, TextInput, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCommissionHistory } from '../../store/slices/walletSlice';
import CommissionFilterModal from '../../components/CommissionFilterModal';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

const formatAmount = (amount) =>
    `\u20B9${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const CommissionHistoryScreen = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const commissions = useSelector((state) => state.wallet?.commissions);
    const loading = useSelector((state) => state.wallet?.loading);
    const error = useSelector((state) => state.wallet?.error);
    const [searchText, setSearchText] = useState('');
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await dispatch(fetchCommissionHistory({ page: 1, limit: 100 }));
        } finally {
            setRefreshing(false);
        }
    }, [dispatch]);

    useEffect(() => {
        console.log('🔍 [commission-history] Fetching commission history...');
        dispatch(fetchCommissionHistory({ page: 1, limit: 100 }));
    }, [dispatch]);

    // Add debug logging for commission data
    useEffect(() => {
        console.log('💰 [commission-history] Commissions state:', commissions);
        console.log('💰 [commission-history] Commissions length:', Array.isArray(commissions) ? commissions.length : 'not an array');
        console.log('💰 [commission-history] Loading:', loading);
        console.log('💰 [commission-history] Error:', error);
    }, [commissions, loading, error]);

    const hasActiveFilters = statusFilter !== 'all' || dateFilter !== 'all';

    const filtered = useMemo(() => {
        if (!Array.isArray(commissions)) return [];
        
        let result = [...commissions];

        // Search filter
        if (searchText) {
            result = result.filter(item =>
                (item.propertyName || '').toLowerCase().includes(searchText.toLowerCase()) ||
                (item.propertyAddress || '').toLowerCase().includes(searchText.toLowerCase()) ||
                (item.amount?.toString() || '').includes(searchText)
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(item => {
                const itemStatus = (item.status || 'credit').toLowerCase();
                // Map 'paid' filter to 'credit' status in data
                if (statusFilter === 'paid') {
                    return  itemStatus === 'paid';
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
    }, [searchText, commissions, statusFilter, dateFilter]);

    const handleOpenFilter = useCallback(() => {
        console.log(' FILTER BUTTON PRESSED - Opening modal!');
        setFilterModalVisible(true);
    }, []);

    const handleApplyFilters = useCallback((filters) => {
        console.log(' [commission-history] Filters applied:', filters);
        setStatusFilter(filters.status);
        setDateFilter(filters.dateFilter);
        setFilterModalVisible(false);
    }, []);

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="pt-[55px] pb-4 px-6 flex-row items-center justify-between border-b border-gray-50">
                <Pressable onPress={() => router.back()} className="p-1">
                    <Ionicons name="arrow-back" size={22} color="black" />
                </Pressable>
                <Text className="text-black text-[18px] font-manrope-bold">Commission History</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Search */}
            <View className="flex-row px-6 mt-4 mb-4 gap-2.5">
                <View className="flex-1 flex-row items-center bg-[#EBF1FF] rounded-xl px-3.5 h-[44px]">
                    <Ionicons name="search" size={18} color="#9CA3AF" />
                    <TextInput
                        placeholder="Search by property or amount"
                        placeholderTextColor="#9CA3AF"
                        value={searchText}
                        onChangeText={setSearchText}
                        className="flex-1 text-[13px] text-black ml-2 font-lato-regular"
                    />
                </View>
                <TouchableOpacity 
                    className="w-[44px] h-[44px] bg-[#EBF1FF] rounded-xl items-center justify-center relative"
                    onPress={() => {
                        console.log('🎯🎯🎯 FILTER BUTTON PRESSED!');
                        handleOpenFilter();
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
                    <Text className="text-gray-400 text-[14px] font-manrope-medium mt-4 text-center">
                        {error}
                    </Text>
                    <Pressable
                        onPress={() => dispatch(fetchCommissionHistory({ page: 1, limit: 100 }))}
                        className="bg-[#4A43EC] px-5 py-3 rounded-xl mt-5"
                    >
                        <Text className="text-white text-[12px] font-manrope-bold">Retry</Text>
                    </Pressable>
                </View>
            ) : filtered.length === 0 ? (
                <View className="flex-1 items-center justify-center px-10">
                    <MaterialCommunityIcons name="cash-remove" size={56} color="#D1D5DB" />
                    <Text className="text-gray-400 text-[14px] font-manrope-medium mt-4 text-center">
                        {searchText ? 'No commissions match your search' : 'No commission history yet'}
                    </Text>
                </View>
            ) : (
                <ScrollView
                    className="flex-1 px-6 pt-4"
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
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {filtered.map((item) => {
                        const rawStatus = String(item.status || 'CREDIT').trim().toLowerCase();
                        const isPending = rawStatus === 'pending';

                        return (
                            <View
                                key={item.id}
                                className="flex-row items-center justify-between py-4 border-b border-gray-50"
                            >
                                <View className="flex-row items-center flex-1 mr-3">
                                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isPending ? 'bg-red-50' : 'bg-[#E8F9EE]'}`}>
                                        <MaterialCommunityIcons 
                                            name={isPending ? "cash-clock" : "cash-plus"} 
                                            size={20} 
                                            color={isPending ? "#ef8844ff" : "#22C55E"} 
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[13px] font-manrope-bold text-[#272727]" numberOfLines={1}>
                                            {item.propertyName || 'Commission Earned'}
                                        </Text>
                                        <View className="flex-row items-center flex-wrap gap-1 mt-0.5">
                                            {item.propertyAddress ? (
                                                <Text className="text-[10px] text-gray-500 font-manrope-medium" numberOfLines={1}>
                                                    {item.propertyAddress} •
                                                </Text>
                                            ) : null}
                                            <Text className="text-[10px] text-gray-400 font-manrope-medium">
                                                {formatDate(item.createdAt)}
                                            </Text>
                                            {item.commissionKind ? (
                                                <Text className="text-[10px] text-[#4A43EC] font-manrope-semibold">
                                                    • {item.commissionKind === 'client_referral' ? 'Client Referral' : 'Property Deal'}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className={`text-[14px] font-manrope-bold ${isPending ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                                        {isPending ? '' : '+'}{formatAmount(item.amount)}
                                    </Text>
                                    {/* FIXED: Dynamic color maps 'pending' transactions explicitly to white text on a red container */}
                                    <View className={`px-2 py-0.5 rounded-full mt-1 ${isPending ? 'bg-[#ef8844ff]' : 'bg-[#E8F9EE]'}`}>
                                        <Text className={`text-[9px] font-manrope-bold uppercase ${isPending ? 'text-white' : 'text-[#22C55E]'}`}>
                                            {item.status || 'CREDIT'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
};

export default CommissionHistoryScreen;