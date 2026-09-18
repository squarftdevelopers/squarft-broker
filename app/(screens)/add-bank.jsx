import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StatusBar, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addBankAccountApi } from '../../store/slices/walletSlice';

const AddBankScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();

    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [reAccountNumber, setReAccountNumber] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleAddBank = async () => {
        if (submitting) return;
        if (!bankName || !accountNumber || !reAccountNumber || !ifsc) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }
        if (accountNumber !== reAccountNumber) {
            Alert.alert("Error", "Account numbers do not match");
            return;
        }

        try {
            setSubmitting(true);
            await dispatch(addBankAccountApi({
                bankName: bankName,
                accountNumber: accountNumber,
                ifscCode: ifsc
            })).unwrap();

            router.replace("/(screens)/bank-success");
        } catch (err) {
            Alert.alert("Error", err || "Failed to add bank account");
        } finally {
            setSubmitting(false);
        }
    };

    const InputField = ({ label, placeholder, value, onChangeText, keyboardType = "default" }) => (
        <View className="mb-5">
            <Text className="text-[14px] font-manrope-bold text-[#272727] mb-2">{label}</Text>
            <View className="border border-gray-100 rounded-xl px-4 py-3.5">
                <TextInput
                    className="text-[14px] font-manrope-medium text-[#272727]"
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                />
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="pt-[55px] pb-4 px-6 flex-row items-center justify-between border-b border-gray-50">
                <Pressable onPress={() => router.back()} className="p-1">
                    <Ionicons name="arrow-back" size={22} color="black" />
                </Pressable>
                <Text className="text-black text-[18px] font-manrope-bold">Add Bank</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                <InputField
                    label="Bank Name"
                    placeholder="enter bank name"
                    value={bankName}
                    onChangeText={setBankName}
                />
                <InputField
                    label="Account number"
                    placeholder="enter account number"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="numeric"
                />
                <InputField
                    label="Re-type Account number"
                    placeholder="re-type account number"
                    value={reAccountNumber}
                    onChangeText={setReAccountNumber}
                    keyboardType="numeric"
                />
                <InputField
                    label="IFSC"
                    placeholder="enter IFSC code"
                    value={ifsc}
                    onChangeText={setIfsc}
                    autoCapitalize="characters"
                />

                <Pressable
                    onPress={handleAddBank}
                    disabled={submitting}
                    className={`bg-[#4A43EC] py-4 rounded-xl items-center justify-center mt-4 mb-10 flex-row ${submitting ? 'opacity-70' : ''}`}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text className="text-white text-[16px] font-manrope-bold">Add Bank Account</Text>
                    )}
                </Pressable>
            </ScrollView>
        </View>
    );
};

export default AddBankScreen;
