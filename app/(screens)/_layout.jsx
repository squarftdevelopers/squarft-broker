import { Stack } from "expo-router";

export default function ScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="customer-requirement" />
      <Stack.Screen name="add-customer-requirement" />
      <Stack.Screen name="customer-details" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="commission-history" />
      <Stack.Screen name="add-bank" />
      <Stack.Screen name="location-picker" />
      <Stack.Screen name="nearby-projects" />
      <Stack.Screen name="project-deal" />
      <Stack.Screen name="bank-success" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
