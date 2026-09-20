import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PremiumRangeSlider from './PremiumRangeSlider';

const { width } = Dimensions.get('window');

function formatBudget(val) {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(0)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
    return `₹${val}`;
}

const mainTypes = [
    {
        id: "residential",
        label: "Residential",
        image: require("../assets/icons/property-types/House2.png"),
        cloudImage: require("../assets/icons/property-types/Clouds.png"),
    },
    {
        id: "commercial",
        label: "Commercial",
        image: require("../assets/icons/property-types/commercial.png"),
    },
];

const subTypesData = {
    residential: [
        { id: "plot", label: "Plot", image: require("../assets/icons/property-types/plot.png") },
        { id: "villa", label: "Villa", image: require("../assets/icons/property-types/villa.png") },
        { id: "apartment", label: "Apartment", image: require("../assets/icons/property-types/apartment.png") },
        { id: "rowhouse", label: "Rowhouse", image: require("../assets/icons/property-types/rowhouse.png") },
    ],
    commercial: [
        { id: "shop", label: "Shop", image: require("../assets/icons/property-types/Shop.png") },
        { id: "showroom", label: "Showroom", image: require("../assets/icons/property-types/showroom.png") },
        { id: "office", label: "Office", image: require("../assets/icons/property-types/office.png") },
    ]
};

const bhkOptions = [
    { id: "1_bhk", label: "1 BHK" },
    { id: "2_bhk", label: "2 BHK" },
    { id: "3_bhk", label: "3 BHK" },
    { id: "4_bhk", label: "4 BHK" },
    { id: "5_plus_bhk", label: "5 BHK+" },
];

const bhkSubTypes = ["plot", "villa", "apartment", "rowhouse"];

const FilterModal = ({ visible, onClose, onApplyFilters }) => {
    const insets = useSafeAreaInsets();
    const bottomSheetModalRef = useRef(null);
    const snapPoints = useMemo(() => ['90%'], []);
    
    // Filter states
    const [selectedMainType, setSelectedMainType] = useState(null);
    const [selectedSubTypes, setSelectedSubTypes] = useState([]); // Array for multiple selection
    const [selectedBhks, setSelectedBhks] = useState([]); // Array for multiple selection
    const [selectedStatus, setSelectedStatus] = useState(null); // 'approved' | 'rejected' | 'pending_review' | null
    const [liveBudget, setLiveBudget] = useState([2000000, 50000000]); // 20L to 5Cr
    
    const BUDGET_MIN = 2000000; // 20L
    const BUDGET_MAX = 50000000; // 5Cr

    useEffect(() => {
        if (visible) {
            bottomSheetModalRef.current?.present();
        } else {
            bottomSheetModalRef.current?.dismiss();
        }
    }, [visible]);

    useEffect(() => {
        setSelectedSubTypes([]);
    }, [selectedMainType]);

    useEffect(() => {
        setSelectedBhks([]);
    }, [selectedSubTypes]);

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

    const subTypes = selectedMainType ? (subTypesData[selectedMainType] || []) : [];
    const showBhk = selectedMainType === "residential" && selectedSubTypes.length > 0 && selectedSubTypes.some(type => bhkSubTypes.includes(type));

    const toggleSubType = (id) => {
        setSelectedSubTypes(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleBhk = (id) => {
        setSelectedBhks(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleApply = () => {
        console.log('🔍 [FilterModal] Applying filters:', {
            category: selectedMainType,
            propertyTypes: selectedSubTypes,
            bhks: showBhk ? selectedBhks : [],
            budgetRange: liveBudget,
            status: selectedStatus,
            isDefaultBudget: liveBudget[0] === 2000000 && liveBudget[1] === 50000000,
        });
        onApplyFilters({
            category: selectedMainType,
            propertyTypes: selectedSubTypes, 
            bhks: showBhk ? selectedBhks : [], 
            budgetRange: liveBudget,
            status: selectedStatus,
        });
        onClose();
    };

    const handleReset = () => {
        setSelectedMainType(null);
        setSelectedSubTypes([]);
        setSelectedBhks([]);
        setSelectedStatus(null);
        setLiveBudget([BUDGET_MIN, BUDGET_MAX]);
    };

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            onDismiss={onClose}
            enablePanDownToClose={true}
            enableDynamicSizing={false}
            handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
        >
            {/* FIXED: Changed layout element container into a clean flex column alignment base */}
            <BottomSheetView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                {/* Header */}
                <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937' }}>Filter</Text>
                </View>

                {/* FIXED: Content scrolls dynamically within layout viewport window boundaries */}
                <BottomSheetScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 32 }}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator
                >
                    {/* Category Selection */}
                    <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
                            Category
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {mainTypes.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    onPress={() => setSelectedMainType(type.id)}
                                    style={{
                                        flex: 1,
                                        borderWidth: 2,
                                        borderColor: selectedMainType === type.id ? '#7C3AED' : '#E5E7EB',
                                        borderRadius: 12,
                                        padding: 16,
                                        alignItems: 'center',
                                        backgroundColor: selectedMainType === type.id ? '#F5F3FF' : '#FFFFFF',
                                    }}
                                // Added follow-up logic checklist for state binding parameters
                                >
                                    <View style={{ position: 'relative', width: 60, height: 60, marginBottom: 8 }}>
                                        <Image
                                            source={type.image}
                                            style={{ width: 60, height: 60 }}
                                            resizeMode="contain"
                                        />
                                        {type.cloudImage && (
                                            <Image
                                                source={type.cloudImage}
                                                style={{ position: 'absolute', top: -8, right: -8, width: 30, height: 30 }}
                                                resizeMode="contain"
                                            />
                                        )}
                                    </View>
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: '#selectedMainType' === type.id ? '#7C3AED' : '#6B7280',
                                    }}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Property Type Selection - MULTI-SELECT */}
                    {selectedMainType && (
                        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
                                Property Type (select multiple)
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                                {subTypes.map((type) => (
                                    <TouchableOpacity
                                        key={type.id}
                                        onPress={() => toggleSubType(type.id)}
                                        style={{
                                            width: (width - 52) / 2,
                                            borderWidth: 2,
                                            borderColor: selectedSubTypes.includes(type.id) ? '#7C3AED' : '#E5E7EB',
                                            borderRadius: 12,
                                            padding: 16,
                                            alignItems: 'center',
                                            backgroundColor: selectedSubTypes.includes(type.id) ? '#F5F3FF' : '#FFFFFF',
                                        }}
                                    >
                                        <Image
                                            source={type.image}
                                            style={{ width: 50, height: 50, marginBottom: 8 }}
                                            resizeMode="contain"
                                        />
                                        <Text style={{
                                            fontSize: 14,
                                            fontWeight: '600',
                                            color: selectedSubTypes.includes(type.id) ? '#7C3AED' : '#6B7280',
                                        }}>
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* BHK Selection - MULTI-SELECT for residential */}
                    {showBhk && (
                        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
                                BHK (select multiple)
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                {bhkOptions.map((bhk) => (
                                    <TouchableOpacity
                                        key={bhk.id}
                                        onPress={() => toggleBhk(bhk.id)}
                                        style={{
                                            paddingHorizontal: 20,
                                            paddingVertical: 12,
                                            borderWidth: 2,
                                            borderColor: selectedBhks.includes(bhk.id) ? '#7C3AED' : '#E5E7EB',
                                            borderRadius: 8,
                                            backgroundColor: selectedBhks.includes(bhk.id) ? '#F5F3FF' : '#FFFFFF',
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: 14,
                                            fontWeight: '600',
                                            color: selectedBhks.includes(bhk.id) ? '#7C3AED' : '#6B7280',
                                        }}>
                                            {bhk.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Property Status Filter */}
                    <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
                            Property Status
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {[
                                { id: null, label: 'All' },
                                { id: 'approved', label: 'Approved' },
                                { id: 'pending_review', label: 'Pending Review' },
                                { id: 'rejected', label: 'Rejected' },
                            ].map((status) => {
                                const isSelected = selectedStatus === status.id;
                                return (
                                    <TouchableOpacity
                                        key={status.label}
                                        onPress={() => setSelectedStatus(status.id)}
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 10,
                                            borderWidth: 2,
                                            borderColor: isSelected ? '#7C3AED' : '#E5E7EB',
                                            borderRadius: 8,
                                            backgroundColor: isSelected ? '#F5F3FF' : '#FFFFFF',
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: 13,
                                            fontWeight: '600',
                                            color: isSelected ? '#7C3AED' : '#6B7280',
                                        }}>
                                            {status.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Budget Range Slider */}
                    <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 20 }}>
                            Budget Range
                        </Text>
                        {/* PERFORMANCE FIX: Isolated rendering updates to prevent layout stutter */}
                        <PremiumRangeSlider
                            min={BUDGET_MIN}
                            max={BUDGET_MAX}
                            initialMin={liveBudget[0]}
                            initialMax={liveBudget[1]}
                            step={100000}
                            onValuesChangeFinish={(values) => setLiveBudget(values)}
                            formatLabel={formatBudget}
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                            {['20L', '1Cr', '2Cr', '3Cr', '5Cr+'].map((l) => (
                                <Text key={l} style={{ fontSize: 11, color: '#9CA3AF' }}>{l}</Text>
                            ))}
                        </View>
                    </View>
                </BottomSheetScrollView>

                {/* Footer Buttons */}
                {/* FIXED: Removed absolute tracking layout to allow buttons to sit naturally under the scroll area */}
                <View style={{
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#E5E7EB',
                    paddingHorizontal: 20,
                    paddingTop: 16,
                    paddingBottom: Math.max(insets.bottom, 12),
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
            </BottomSheetView>
        </BottomSheetModal>
    );
};

export default FilterModal;
