import { Stack } from 'expo-router'; // Ganti Tabs dengan Stack
import React from 'react';

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, }} >
      <Stack.Screen name="index" />
    </Stack>
  );
}
