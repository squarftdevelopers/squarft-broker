import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StatusBar, TextInput, Alert, RefreshControl } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTransactions } from '../../store/slices/walletSlice';

const EMPTY_TRANSACTIONS = [];

const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const TransactionsScreen = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const bottomSheetModalRef = useRef(null);
    const transactions = useSelector((state) => state.wallet?.transactions) ?? EMPTY_TRANSACTIONS;
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await dispatch(fetchTransactions());
        } finally {
            setRefreshing(false);
        }
    }, [dispatch]);

    React.useEffect(() => {
        dispatch(fetchTransactions());
    }, [dispatch]);

    const filteredTransactions = useMemo(() => {
        if (!searchText) return transactions;
        return transactions.filter(item =>
            (item.property_name || 'Commission').toLowerCase().includes(searchText.toLowerCase()) ||
            item.type.toLowerCase().includes(searchText.toLowerCase()) ||
            item.amount.toString().includes(searchText)
        );
    }, [searchText, transactions]);

    const snapPoints = useMemo(() => ['45%'], []);

    const handlePresentModalPress = useCallback((transaction) => {
        setSelectedTransaction(transaction);
        bottomSheetModalRef.current?.present();
    }, []);

    const handleCopyTransaction = useCallback(async () => {
        const transactionNumber = selectedTransaction?.transactionNo || selectedTransaction?.id;
        if (transactionNumber === null || transactionNumber === undefined) return;
        await Clipboard.setStringAsync(String(transactionNumber));
        Alert.alert('Copied', 'Transaction number copied to clipboard.');
    }, [selectedTransaction]);

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="pt-[55px] pb-4 px-6 flex-row items-center justify-between border-b border-gray-50">
                <Pressable onPress={() => router.back()} className="p-1">
                    <Ionicons name="arrow-back" size={22} color="black" />
                </Pressable>
                <Text className="text-black text-[18px] font-manrope-bold">Transactions</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Search Bar */}
            <View className="px-6 mt-4">
                <View className="flex-row items-center bg-[#EBF1FF] rounded-xl px-3.5 h-[44px]">
                    <Ionicons name="search" size={18} color="#9CA3AF" />
                    <TextInput
                        placeholder="Search"
                        placeholderTextColor="#9CA3AF"
                        value={searchText}
                        onChangeText={setSearchText}
                        className="flex-1 text-[13px] text-black ml-2 font-lato-regular"
                    />
                </View>
            </View>

            {/* Transactions List */}
            <View className="flex-1 px-6 pt-6">

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    alwaysBounceVertical={true}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#4A43EC"]}
                            tintColor="#4A43EC"
                        />
                    }
                >
                    {filteredTransactions.map((item, index) => (
                        <Pressable
                            key={item.id}
                            onPress={() => handlePresentModalPress(item)}
                            className="flex-row items-center justify-between py-3.5 border-b border-gray-50"
                        >
                            <View>
                                <Text className="text-[12px] font-manrope-bold text-[#272727]">
                                    {item.property_name || (item.type === 'debit' ? 'Bank Withdrawal' : 'Commission Earned')}
                                </Text>
                                <Text className="text-[9px] text-gray-400 font-manrope-medium mt-1">{formatDate(item.created_at)}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <Text className={`${item.type === 'credit' ? 'text-[#22C55E]' : 'text-[#EF4444]'} text-[12px] font-manrope-bold mr-2`}>
                                    {item.type === 'credit' ? '+' : '-'}₹{Number(item.amount).toLocaleString('en-IN')}
                                </Text>
                                <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* Bottom Sheet Modal */}
            <BottomSheetModal
                ref={bottomSheetModalRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                handleIndicatorStyle={{ backgroundColor: '#E1E1E1', width: 40 }}
                style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -10 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    elevation: 20,
                }}
            >
                <BottomSheetView className="flex-1 px-6 pt-5">
                    <View className="mb-1">
                        <Text className="text-[15px] font-manrope-extrabold text-[#272727]">
                            {selectedTransaction?.title || (selectedTransaction?.type === 'debit' ? 'Bank Withdrawal' : 'Commission Earned')}
                        </Text>
                    </View>
                    <Text className="text-gray-400 font-manrope-medium mb-5 text-[11px]">
                        {selectedTransaction?.location || (selectedTransaction?.type === 'credit' ? 'Earned from property deal' : 'Withdrawal to bank')}
                    </Text>

                    <View className={`${selectedTransaction?.type === 'debit' ? 'bg-red-50' : 'bg-[#E8F9EE]'} rounded-[12px] py-3 items-center mb-5`}>
                        <Text className={`${selectedTransaction?.type === 'debit' ? 'text-[#EF4444]' : 'text-[#22C55E]'} text-[20px] font-manrope-extrabold`}>
                            {selectedTransaction?.type === 'debit' ? '-' : '+'}₹{Number(selectedTransaction?.amount).toLocaleString('en-IN')}
                        </Text>
                    </View>

                    <View className="bg-white border border-gray-100 rounded-[14px] p-3.5 mb-3.5" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5 }}>
                        <Text className="text-gray-400 text-[9px] font-manrope-medium mb-1 uppercase tracking-wider">
                            {selectedTransaction?.type === 'debit' ? 'Transferred to' : 'Details'}
                        </Text>
                        <Text className="text-[#272727] text-[13px] font-manrope-bold">
                            {selectedTransaction?.bank || selectedTransaction?.transfer_to_details || selectedTransaction?.property_address || (selectedTransaction?.type === 'debit' ? 'Bank Account' : 'Wallet Main Balance')}
                        </Text>
                    </View>

                    <View className="bg-white border border-gray-100 rounded-[14px] p-3.5 flex-row items-center justify-between" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5 }}>
                        <View>
                            <Text className="text-gray-400 text-[9px] font-manrope-medium mb-1 uppercase tracking-wider">
                                {selectedTransaction?.utr ? 'UTR / Ref No.' : 'Transaction no.'}
                            </Text>
                            <Text className="text-[#272727] text-[13px] font-manrope-bold">
                                {selectedTransaction?.utr || selectedTransaction?.transactionNo || (selectedTransaction?.id ? selectedTransaction.id.toString().slice(0, 8) + '...' : 'N/A')}
                            </Text>
                        </View>
                        <Pressable
                            onPress={handleCopyTransaction}
                            accessibilityRole="button"
                            accessibilityLabel="Copy transaction number"
                            className="p-2 border border-blue-50 bg-blue-50/30 rounded-xl"
                        >
                            <Ionicons name="copy-outline" size={18} color="#4D45ED" />
                        </Pressable>
                    </View>
                </BottomSheetView>
            </BottomSheetModal>
        </View>
    );
};

export default TransactionsScreen;
