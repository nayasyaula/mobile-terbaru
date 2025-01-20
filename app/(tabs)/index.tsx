import React from 'react';
import { Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Import from expo-linear-gradient
import { useRouter } from 'expo-router'; // Use expo-router for navigation

export default function Index() {
  const router = useRouter(); // Get router instance

  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/logo1.png')} style={styles.image} />
      <Text style={styles.text}>
        Create, share and play miginfo whenever and wherever you want
      </Text>
      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={() => router.push('/login')} // Navigate to the login page
      >
        <LinearGradient colors={['#00509F', '#001D39']} style={styles.gradient}>
          <Text style={styles.buttonText}>Get Started</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  text: {
    width: 240,
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 30,
    textAlign: 'center',
    letterSpacing: -0.32,
    marginBottom: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    width: '110%',
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    paddingVertical: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
