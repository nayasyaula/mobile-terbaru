import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Link } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CameraPage: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Menampilkan gambar face-id */}
      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/face-id.jpg')} // Pastikan path sesuai dengan lokasi gambar
          style={styles.image}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Link href="/home" style={styles.iconContainer}>
          <Ionicons name="home" size={28} color="#666666" />
        </Link>
        <Link href="/attendance" style={styles.iconContainer}>
          <Ionicons name="newspaper" size={28} color="#666666" />
        </Link>
        <Link href="/scan" style={styles.iconContainer}>
          <Ionicons name="camera-sharp" size={29} color="#00509F" />
        </Link>
        <Link href="/todo" style={styles.iconContainer}>
          <Ionicons name="book" size={28} color="#666666" />
        </Link>
        <Link href="/profile" style={styles.iconContainer}>
          <Ionicons name="person" size={28} color="#666666" />
        </Link>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
    paddingTop: 50,
  },
  imageContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 300, // Ukuran gambar bisa disesuaikan
    height: 300, // Ukuran gambar bisa disesuaikan
    resizeMode: 'contain',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Membuat ikon tersebar dari kiri ke kanan
    marginTop: 30,
  },
  iconContainer: {
    alignItems: 'center',
  },
});

export default CameraPage;