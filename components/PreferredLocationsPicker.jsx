import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalizePreferredLocations, addPreferredLocation } from '../utils/preferredLocations';
import LocationMapPicker from './LocationMapPicker';

export default function PreferredLocationsPicker({ value = [], onChange }) {
  const [open, setOpen] = useState(false);
  const locations = normalizePreferredLocations(value);
  return <View>
    <Pressable accessibilityRole="button" accessibilityLabel="Add preferred location on map" onPress={() => setOpen(true)}
      className="min-h-[48px] rounded-xl border border-gray-300 bg-white px-3 flex-row items-center">
      <Ionicons name="location" size={19} color="#4A43EC" />
      <Text className="flex-1 mx-2 text-sm text-gray-500">Add location on map</Text>
      <Ionicons name="map-outline" size={22} color="#4A43EC" />
    </Pressable>
    <View className="mt-3" style={{ gap: 8 }}>
      {locations.map((location, index) => <View key={`${location}-${index}`} className="rounded-xl bg-indigo-50 px-3 py-2 flex-row items-center">
        <Text className="flex-1 text-xs text-indigo-800">{location}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove location ${location}`} hitSlop={8} onPress={() => onChange(locations.filter((_, i) => i !== index))} className="ml-2 p-1">
          <Ionicons name="close" size={17} color="#4A43EC" />
        </Pressable>
      </View>)}
    </View>
    <LocationMapPicker visible={open} onClose={() => setOpen(false)} confirmLabel="Add preferred location" onConfirm={address => {
      const location = (address.location || address.address || [address.city, address.state].filter(Boolean).join(', ')).trim();
      if (!location) return Alert.alert('Select a location', 'Choose a location on the map first.');
      onChange(addPreferredLocation(locations, location));
      setOpen(false);
    }} />
  </View>;
}
