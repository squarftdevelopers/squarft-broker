import { View, Text, Image, ActivityIndicator, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { memo, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRequirementTimeline } from '../../store/slices/requirementsSlice';
import TimelineItem from './TimelineItem';
import ImageLightbox from '../ImageLightbox';

const formatTimelineDate = (value) => value
    ? new Date(value).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
    : null;

const STAGES = [
    { event_type: 'REQUEST_RECEIVED', title: 'Request received', icon: 'checkmark' },
    { event_type: 'SALES_OFFICER_ASSIGNED', title: 'Sales officer assigned', icon: 'person-outline' },
    { event_type: 'PROPERTIES_SHORTLISTED', title: 'Properties shortlisted', icon: 'home-outline' },
    { event_type: 'SITE_VISIT_SCHEDULED', title: 'Site visit scheduled', icon: 'calendar-outline' },
    { event_type: 'NEGOTIATION', title: 'Negotiation', icon: 'chatbubbles-outline' },
    { event_type: 'TOKEN_PAYMENT', title: 'Token payment', icon: 'cash-outline', time: 'Waiting for price agreement' },
    { event_type: 'REGISTRY_PROCESS', title: 'Registry process', icon: 'document-text-outline', time: 'Documentation queue' },
    { event_type: 'DEAL_COMPLETED', title: 'Deal completed', icon: 'trophy-outline', time: 'Handover & Keys' },
];

const TabTimeline = memo(function TabTimeline({ requirementId }) {
    const dispatch = useDispatch();
    const { timeline, timelineLoading, timelineError } = useSelector((state) => state.requirements);
    const [galleryImages, setGalleryImages] = useState([]);
    const [galleryStartIndex, setGalleryStartIndex] = useState(0);

    const stages = useMemo(() => STAGES.map((stage, index) => {
        const event = timeline.find((item) => item.event_type === stage.event_type);
        return {
            ...stage,
            ...event,
            id: event?.id || stage.event_type,
            status: event?.status || 'pending',
            badge: event?.badge || (event?.status === 'current' ? 'IN PROGRESS' : null),
            stageNumber: index + 1,
        };
    }), [timeline]);
    useEffect(() => {
        if (requirementId) dispatch(fetchRequirementTimeline(requirementId));
    }, [dispatch, requirementId]);

    const completedCount = stages.filter((item) => item.status === 'completed').length;
    const currentIndex = stages.findIndex((item) => item.status === 'current');
    const activeStage = currentIndex >= 0 ? currentIndex + 1 : completedCount;

    return (
        <View className="bg-white rounded-2xl px-5 pt-5 pb-3 mb-4 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center mb-5">
                <Text className="text-[14px] font-manrope-bold text-[#111827]">Timeline Progress</Text>
                <View className="bg-[#EEEDFF] px-2.5 py-1 rounded-full">
                    <Text className="text-[10px] font-manrope-bold text-[#4F48ED]">
                        Stage {activeStage} of {stages.length}
                    </Text>
                </View>
            </View>

            <View className="relative">
                {timelineLoading && <ActivityIndicator color="#6231FF" />}
                {!timelineLoading && timelineError && (
                    <Text className="text-xs text-red-500">{timelineError}</Text>
                )}
                {!timelineLoading && !timelineError && stages.map((item, index) => (
                    <TimelineItem
                        key={item.id}
                        index={index}
                        status={item.status}
                        title={item.title}
                        time={formatTimelineDate(item.created_at) || item.time}
                        badge={item.badge}
                        iconName={item.metadata?.icon_name || item.icon}
                        isLast={index === stages.length - 1}
                        connectorCompleted={['completed', 'current'].includes(stages[index + 1]?.status)}
                    >
                        {item.metadata?.images?.length > 0 && (
                            <View className="flex-row gap-2 mt-2 mb-1">
                                {item.metadata.images.map((img, idx) => (
                                    <Pressable key={idx} onPress={() => { setGalleryImages(item.metadata.images); setGalleryStartIndex(idx); }}>
                                        <Image source={{ uri: img }} className="w-[36px] h-[36px] rounded-[8px]" />
                                    </Pressable>
                                ))}
                                {item.metadata.extra_images_count > 0 && (
                                    <Pressable onPress={() => { setGalleryImages(item.metadata.images); setGalleryStartIndex(0); }} className="w-[36px] h-[36px] bg-[#F3F4F6] rounded-[8px] justify-center items-center">
                                        <Text className="text-[10px] font-manrope-semibold text-[#4B5563]">+{item.metadata.extra_images_count}</Text>
                                    </Pressable>
                                )}
                            </View>
                        )}
                        {item.metadata?.action_text && item.metadata?.action_icon && (
                            <View className="mt-2 flex-row items-center bg-[#F3F4F6] px-2 py-1 rounded-[6px] self-start gap-1.5">
                                <Feather name={item.metadata.action_icon} size={10} color="#6231FF" />
                                <Text className="text-[10px] font-manrope-semibold text-[#1F2937]">{item.metadata.action_text}</Text>
                            </View>
                        )}
                        {item.description && (
                            <View>
                                <Text className="text-[11px] font-manrope-medium text-[#6B7280] mt-1 pr-4 leading-[16px] flex-1 mb-1">
                                    {item.description}
                                </Text>
                                {item.metadata?.asking_price && item.metadata?.current_offer && (
                                    <View className="mt-2 bg-[#FCFAFF] border border-[#EBE5FF] rounded-lg p-2.5">
                                        <View className="flex-row justify-between items-center mb-1">
                                            <Text className="text-[10px] font-manrope-medium text-[#6B7280]">Asking Price:</Text>
                                            <Text className="text-[12px] font-manrope-bold text-[#111827]">{item.metadata.asking_price}</Text>
                                        </View>
                                        <View className="flex-row justify-between items-center">
                                            <Text className="text-[10px] font-manrope-medium text-[#6B7280]">Current Offer:</Text>
                                            <Text className="text-[12px] font-manrope-bold text-[#6231FF]">{item.metadata.current_offer}</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </TimelineItem>
                ))}
            </View>
            <ImageLightbox visible={galleryImages.length > 0} images={galleryImages} startIndex={galleryStartIndex} onClose={() => setGalleryImages([])} />
        </View>
    );
});

export default TabTimeline;
