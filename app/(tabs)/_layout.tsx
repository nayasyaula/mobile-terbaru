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
      <Stack.Screen name="profile" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="todo" />
      <Stack.Screen name="pass" />
      <Stack.Screen name="about" />
    </Stack>
  );
}
