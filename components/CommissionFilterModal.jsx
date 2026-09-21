import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CommissionFilterModal = ({ visible, onClose, onApplyFilters, initialStatus = 'all', initialDateFilter = 'all' }) => {
    const insets = useSafeAreaInsets();
    const bottomSheetModalRef = useRef(null);
    const snapPoints = useMemo(() => ['90%'], []);
    
    const [tempStatusFilter, setTempStatusFilter] = useState(initialStatus);
    const [tempDateFilter, setTempDateFilter] = useState(initialDateFilter);

    useEffect(() => {
        console.log('📊 [CommissionFilterModal] Visible changed:', visible);
        if (visible) {
            bottomSheetModalRef.current?.present();
        } else {
            bottomSheetModalRef.current?.dismiss();
        }
    }, [visible]);

    useEffect(() => {
        setTempStatusFilter(initialStatus);
        setTempDateFilter(initialDateFilter);
    }, [initialStatus, initialDateFilter]);

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

    const handleApply = () => {
        console.log('📊 [CommissionFilterModal] Applying filters:', {
            status: tempStatusFilter,
            dateFilter: tempDateFilter,
        });
        onApplyFilters({
            status: tempStatusFilter,
            dateFilter: tempDateFilter,
        });
        onClose();
    };

    const handleReset = () => {
        console.log('📊 [CommissionFilterModal] Resetting filters');
        setTempStatusFilter('all');
        setTempDateFilter('all');
    };

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            onDismiss={onClose}
            enablePanDownToClose={true}
            handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
            bottomInset={insets.bottom}
        >
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                {/* Header */}
                <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937' }}>Filter Commissions</Text>
                </View>

                <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
                    {/* Status Filter */}
                    <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
                            Status
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {[
                                { id: 'all', label: 'All Status' },
                                { id: 'paid', label: 'Paid' },
                                { id: 'pending', label: 'Pending' },
                            ].map((status) => (
                                <TouchableOpacity
                                    key={status.id}
                                    onPress={() => {
                                        console.log('📊 Status selected:', status.id);
                                        setTempStatusFilter(status.id);
                                    }}
                                    style={{
                                        paddingHorizontal: 20,
                                        paddingVertical: 12,
                                        borderWidth: 2,
                                        borderColor: tempStatusFilter === status.id ? '#7C3AED' : '#E5E7EB',
                                        borderRadius: 8,
                                        backgroundColor: tempStatusFilter === status.id ? '#F5F3FF' : '#FFFFFF',
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: tempStatusFilter === status.id ? '#7C3AED' : '#6B7280',
                                    }}>
                                        {status.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Date Range Filter */}
                    <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
                            Time Period
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {[
                                { id: 'all', label: 'All Time' },
                                { id: 'month', label: 'This Month' },
                                { id: '3months', label: 'Last 3 Months' },
                                { id: '6months', label: 'Last 6 Months' },
                            ].map((period) => (
                                <TouchableOpacity
                                    key={period.id}
                                    onPress={() => {
                                        console.log('📊 Date filter selected:', period.id);
                                        setTempDateFilter(period.id);
                                    }}
                                    style={{
                                        paddingHorizontal: 20,
                                        paddingVertical: 12,
                                        borderWidth: 2,
                                        borderColor: tempDateFilter === period.id ? '#7C3AED' : '#E5E7EB',
                                        borderRadius: 8,
                                        backgroundColor: tempDateFilter === period.id ? '#F5F3FF' : '#FFFFFF',
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: tempDateFilter === period.id ? '#7C3AED' : '#6B7280',
                                    }}>
                                        {period.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </BottomSheetScrollView>

                {/* Footer Buttons */}
                <View style={{
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#E5E7EB',
                    paddingHorizontal: 20,
                    paddingTop: 16,
                    paddingBottom: Math.max(insets.bottom, 16),
                    flexDirection: 'row',
                    gap: 12,
                }}>
                    <TouchableOpacity
                        onPress={handleReset}
                        style={{
                            flex: 1,
                            paddingVertical: 14,
                            borderRadius: 8,
                            borderWidth: 2,
                            borderColor: '#7C3AED',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#7C3AED' }}>
                            Reset
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleApply}
                        style={{
                            flex: 1,
                            paddingVertical: 14,
                            borderRadius: 8,
                            backgroundColor: '#7C3AED',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                            Apply
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </BottomSheetModal>
    );
};

export default CommissionFilterModal;
