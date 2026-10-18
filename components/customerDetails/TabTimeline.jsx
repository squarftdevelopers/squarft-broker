import { useCallback, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from 'expo-router';
import DealTimeline from '../dealTimeline/TabTimeline';
import DealCard from '../dealTimeline/DealCard';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.31.27:3001';

export default function TabTimeline({ requirementId, refreshVersion = 0 }) {
    const token = useSelector(state => state.auth.token);
    const [data, setData] = useState(null);
    const [selection, setSelection] = useState(null);
    const selectedDeal = selection?.requirementId === requirementId ? selection.dealId : null;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);
    useFocusEffect(useCallback(() => {
        const controller = new AbortController();
        setLoading(true);
        setError('');
        const query = selectedDeal ? `?dealId=${encodeURIComponent(selectedDeal)}` : '';
        fetch(`${API_BASE_URL}/api/v1/broker/customer/${requirementId}/deal-progress${query}`, {
            headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
        }).then(async response => {
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load customer deals.');
            if (!controller.signal.aborted) setData(result.data);
        }).catch(err => {
            if (!controller.signal.aborted) setError(err.message || 'Unable to load customer deals.');
        }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
        // Refresh and retry intentionally reload the same selected deal.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requirementId, token, selectedDeal, refreshVersion, retry]));
    useFocusEffect(useCallback(() => {
        if (!selectedDeal) return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => { setSelection(null); return true; });
        return () => subscription.remove();
    }, [selectedDeal]));

    return <View className="mb-4">
        <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[14px] font-manrope-bold text-[#111827]">{selectedDeal ? 'Deal timeline' : 'Customer deals'}</Text>
            {selectedDeal && <Pressable accessibilityRole="button" onPress={() => setSelection(null)} hitSlop={8}><Text className="text-xs font-manrope-bold text-[#4F48ED]">← All deals</Text></Pressable>}
        </View>
        {loading ? <View accessibilityLabel="Loading customer deals" className="py-8"><ActivityIndicator color="#6231FF" /></View> : error ? <View className="rounded-xl bg-white p-4"><Text className="text-xs text-red-600">{error}</Text><Pressable onPress={() => setRetry(value => value + 1)} className="mt-3"><Text className="text-sm font-manrope-bold text-[#6231FF]">Try again</Text></Pressable></View> : selectedDeal ? <View className="bg-white rounded-2xl p-5 border border-gray-100">
            <Text className="mb-4 text-sm font-manrope-bold text-gray-900">{data?.deals?.find(deal => deal.id === selectedDeal)?.property_title || 'Deal'}</Text>
            <DealTimeline key={selectedDeal} timeline={data?.timeline || []} currentStageIndex={0} activity={data?.activity || {}} />
        </View> : data?.deals?.length ? data.deals.map(deal => <DealCard key={deal.id} deal={deal} animKey={`${refreshVersion}-${retry}`} onPress={() => setSelection({ requirementId, dealId: deal.id })} />) : <View className="rounded-xl border border-gray-200 bg-white p-5"><Text className="text-sm font-manrope-bold text-gray-800">No deals yet</Text><Text className="mt-2 text-xs text-gray-500">Deals created for this customer will appear here.</Text></View>}
    </View>;
}
