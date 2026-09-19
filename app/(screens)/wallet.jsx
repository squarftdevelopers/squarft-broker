import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StatusBar, TextInput, Alert, RefreshControl, ActivityIndicator, Animated } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { fetchWalletOverview, fetchBankAccounts, fetchTransactions, requestWithdrawalApi } from '../../store/slices/walletSlice';
import * as Clipboard from 'expo-clipboard';

// Skeleton pulse component for loading states
const SkeletonBox = ({ width, height, borderRadius = 8, style }) => {
    const opacity = useRef(new Animated.Value(0.4)).current;
    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [opacity]);
    return (
        <Animated.View
            style={[{ width, height, borderRadius, backgroundColor: 'rgba(255,255,255,0.3)', opacity }, style]}
        />
    );
};

const EMPTY_ARRAY = [];

const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const WalletScreen = () => {
    const router = useRouter();
    const { withdraw } = useLocalSearchParams();
    const dispatch = useDispatch();
    const balance = useSelector((state) => state.wallet?.balance);
    const bankAccounts = useSelector((state) => state.wallet?.bankAccounts) ?? EMPTY_ARRAY;
    const transactions = useSelector((state) => state.wallet?.transactions) ?? EMPTY_ARRAY;
    const [refreshing, setRefreshing] = useState(false);
    const [overviewLoading, setOverviewLoading] = useState(true);
    const [txLoading, setTxLoading] = useState(true);

    // States for view toggle and withdraw form
    const [isWithdrawMode, setIsWithdrawMode] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.allSettled([
                dispatch(fetchWalletOverview()),
                dispatch(fetchBankAccounts()),
                dispatch(fetchTransactions({ limit: 5 })),
            ]);
        } finally {
            setRefreshing(false);
        }
    }, [dispatch]);

    useEffect(() => {
        setOverviewLoading(true);
        setTxLoading(true);
        Promise.allSettled([
            dispatch(fetchWalletOverview()),
            dispatch(fetchBankAccounts()),
        ]).finally(() => setOverviewLoading(false));
        dispatch(fetchTransactions({ limit: 5 })).finally(() => setTxLoading(false));
        if (withdraw === 'true') {
            setIsWithdrawMode(true);
        }
    }, [withdraw, dispatch]);
    const [amount, setAmount] = useState('');
    const [selectedBankId, setSelectedBankId] = useState(null);

    useEffect(() => {
        if (bankAccounts.length === 1) setSelectedBankId(bankAccounts[0].id);
    }, [bankAccounts]);

    const bottomSheetModalRef = useRef(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const snapPoints = useMemo(() => ['48%'], []);

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
            <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
        ),
        []
    );

    const handleWithdraw = useCallback(async () => {
        if (isWithdrawing) return;
        if (!amount || isNaN(parseFloat(amount))) return;
        if (parseFloat(amount) > balance) {
            Alert.alert("Error", "Insufficient balance");
            return;
        }
        if (!selectedBankId && bankAccounts.length > 0) {
            Alert.alert("Error", "Please select a bank account");
            return;
        }
        if (bankAccounts.length === 0) {
            Alert.alert("Error", "Please add a bank account first");
            return;
        }

        try {
            setIsWithdrawing(true);
            await dispatch(requestWithdrawalApi({ amount: Number(amount) })).unwrap();
            setAmount('');
            setIsWithdrawMode(false);
            dispatch(fetchWalletOverview());
            dispatch(fetchTransactions({ limit: 5 }));
            Alert.alert("Success", `₹${amount} withdrawal initiated successfully`);
        } catch (err) {
            Alert.alert("Error", err || "Withdrawal failed");
        } finally {
            setIsWithdrawing(false);
        }
    }, [isWithdrawing, amount, balance, selectedBankId, bankAccounts, dispatch]);

    const handleBack = useCallback(() => {
        if (isWithdrawMode) {
            setIsWithdrawMode(false);
        } else {
            router.back();
        }
    }, [isWithdrawMode, router]);

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="light-content" />

            {/* Header Area */}
            <View className={`bg-[#4A43EC] pt-[55px] ${isWithdrawMode ? 'pb-10' : 'pb-12'} px-6`}>
                <View className="flex-row items-center justify-between">
                    <Pressable onPress={handleBack} className="p-1">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </Pressable>
                    <Text className="text-white text-[18px] font-lato-bold">
                        {isWithdrawMode ? 'Withdraw' : 'My Wallet'}
                    </Text>
                    <View style={{ width: 32 }} />
                </View>

                {/* Balance Card */}
                <View
                    style={{
                        backgroundColor: '#5C94FFA6',
                        borderRadius: 18,
                        marginTop: 20,
                        padding: 18,
                        shadowColor: "#4194FF",
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                    }}
                >
                    <Text className="text-blue-100 text-center text-[11px] font-manrope-medium mb-0.5">Main balance</Text>

                    {/* Balance amount — skeleton while loading, real value once ready */}
                    {overviewLoading ? (
                        <View className="items-center mb-5">
                            <SkeletonBox width={140} height={34} borderRadius={10} style={{ marginBottom: 0 }} />
                        </View>
                    ) : (
                        <Text className="text-white text-center text-[26px] font-manrope-extrabold mb-5">
                            ₹{balance?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </Text>
                    )}

                    {!isWithdrawMode && (
                        <View className="flex-row justify-between items-center px-4">
                            <Pressable 
                                onPress={() => setIsWithdrawMode(true)}
                                className="items-center flex-1"
                            >
                                <View className="mb-1">
                                    <MaterialCommunityIcons name="tray-arrow-down" size={18} color="white" />
                                </View>
                                <Text className="text-white text-[9px] font-manrope-medium">Withdraw</Text>
                            </Pressable>

                            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)', height: 24 }} />

                            <Pressable
                                onPress={() => router.push("/(screens)/transactions")}
                                className="items-center flex-1"
                            >
                                <View className="mb-1">
                                    <MaterialCommunityIcons name="history" size={18} color="white" />
                                </View>
                                <Text className="text-white text-[9px] font-manrope-medium">Transactions</Text>
                            </Pressable>

                            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)', height: 24 }} />

                            <Pressable
                                onPress={() => router.push("/(screens)/commission-history")}
                                className="items-center flex-1"
                            >
                                <View className="mb-1">
                                    <MaterialCommunityIcons name="cash-plus" size={18} color="white" />
                                </View>
                                <Text className="text-white text-[9px] font-manrope-medium">Commission</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>

            {/* Content Area */}
            {!isWithdrawMode ? (
                <View className="flex-1 px-6 pt-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-[14px] font-manrope-extrabold text-[#272727]">Latest Transactions</Text>
                        <Pressable onPress={() => router.push("/(screens)/transactions")}>
                            <Text className="text-[10px] text-gray-400 font-manrope-medium">View all</Text>
                        </Pressable>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        alwaysBounceVertical={true}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={["#4A43EC"]}
                                tintColor="#4A43EC"
                            />
                        }
                    >
                        {/* Transactions section — spinner inside the list area while loading */}
                        {txLoading ? (
                            <View className="items-center justify-center py-10">
                                <ActivityIndicator size="small" color="#4A43EC" />
                                <Text className="text-gray-400 text-[11px] font-manrope-medium mt-2">Loading transactions…</Text>
                            </View>
                        ) : transactions.length === 0 ? (
                            <View className="items-center justify-center py-10">
                                <MaterialCommunityIcons name="receipt" size={32} color="#D1D5DB" />
                                <Text className="text-gray-400 text-[12px] font-manrope-medium mt-2">No transactions yet</Text>
                            </View>
                        ) : (
                            transactions.map((item) => (
                                <Pressable
                                    key={item.id}
                                    onPress={() => handlePresentModalPress(item)}
                                    className="flex-row items-center justify-between py-3 border-b border-gray-100"
                                >
                                    <View>
                                        <Text className="text-[13px] font-manrope-bold text-[#272727]">
                                            {item.property_name || (item.type === 'debit' ? 'Bank Withdrawal' : 'Commission Earned')}
                                        </Text>
                                        <Text className="text-[9px] text-gray-400 font-manrope-medium mt-1">{formatDate(item.created_at)}</Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Text className={`${item.type === 'credit' ? 'text-[#22C55E]' : 'text-[#EF4444]'} text-[13px] font-manrope-bold mr-2`}>
                                            {item.type === 'credit' ? '+' : '-'}₹{Number(item.amount).toLocaleString('en-IN')}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                                    </View>
                                </Pressable>
                            ))
                        )}
                    </ScrollView>
                </View>
            ) : (
                <ScrollView
                    className="flex-1 px-6 pt-8"
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
                >
                    <Text className="text-[14px] font-manrope-bold text-[#272727] mb-3">Enter amount</Text>
                    <View className="flex-row items-center border border-gray-100 rounded-xl px-4 py-3.5 mb-8">
                        <Text className="text-gray-400 text-[15px] font-manrope-medium mr-2">₹</Text>
                        <TextInput
                            className="flex-1 text-[15px] font-manrope-bold text-[#272727]"
                            placeholder="00.00"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>

                    <Text className="text-[14px] font-manrope-bold text-[#272727] mb-3">Send wallet amount to</Text>
                    
                    {bankAccounts.length > 0 ? (
                        bankAccounts.map((bank) => (
                            <Pressable
                                key={bank.id}
                                onPress={() => setSelectedBankId(bank.id)}
                                className={`flex-row items-center bg-white border ${selectedBankId === bank.id ? 'border-[#4A43EC]' : 'border-gray-100'} rounded-xl p-4 mb-4`}
                            >
                                <View className="w-10 h-10 bg-[#EBF1FF] rounded-lg items-center justify-center mr-3">
                                    <MaterialCommunityIcons name="bank" size={20} color="#4A43EC" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[13px] font-manrope-bold text-[#272727]">{bank.bankName}</Text>
                                    <Text className="text-[10px] text-gray-400 font-manrope-medium mt-0.5">{bank.accountNumberMasked}</Text>
                                </View>
                                <View className={`w-5 h-5 rounded-full border items-center justify-center ${selectedBankId === bank.id ? 'border-[#4A43EC]' : 'border-gray-300'}`}>
                                    {selectedBankId === bank.id && <View className="w-2.5 h-2.5 rounded-full bg-[#4A43EC]" />}
                                </View>
                            </Pressable>
                        ))
                    ) : (
                        <View className="bg-gray-50 rounded-xl p-8 items-center justify-center mb-6 border border-dashed border-gray-200">
                            <Text className="text-gray-400 text-[12px] font-manrope-medium">No bank account added yet</Text>
                        </View>
                    )}

                    {bankAccounts.length === 0 && (
                        <Pressable
                            onPress={() => router.push("/(screens)/add-bank")}
                            className="bg-[#EBF1FF] py-4 rounded-xl items-center justify-center"
                        >
                            <Text className="text-[#4A43EC] text-[14px] font-manrope-bold">+ Add Bank Account</Text>
                        </Pressable>
                    )}
                    
                    {amount !== '' && (
                        <Pressable
                            onPress={handleWithdraw}
                            disabled={isWithdrawing}
                            className={`bg-[#4A43EC] py-4 rounded-xl items-center justify-center mt-8 mb-10 flex-row ${isWithdrawing ? 'opacity-70' : ''}`}
                        >
                            {isWithdrawing ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text className="text-white text-[16px] font-manrope-bold">Withdraw Now</Text>
                            )}
                        </Pressable>
                    )}
                </ScrollView>
            )}

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
                    <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-[15px] font-manrope-extrabold text-[#272727]">
                            {selectedTransaction?.property_name || (selectedTransaction?.type === 'debit' ? 'Bank Withdrawal' : 'Commission Earned')}
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
                            {selectedTransaction?.bank_name || selectedTransaction?.transfer_to_details || selectedTransaction?.property_address || (selectedTransaction?.type === 'debit' ? 'Bank Account' : 'Wallet Main Balance')}
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
                            <Ionicons name="copy-outline" size={20} color="#4D45ED" />
                        </Pressable>
                    </View>
                </BottomSheetView>
            </BottomSheetModal>
        </View>
    );
};

export default WalletScreen;
