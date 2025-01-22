import { Stack } from 'expo-router'; // Ganti Tabs dengan Stack
import React from 'react';

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, }} >
      <Stack.Screen name="index" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="home" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signUp" />
    </Stack>
  );
}
