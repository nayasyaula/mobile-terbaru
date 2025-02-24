import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import moment from 'moment-timezone';
import { Link } from 'expo-router';

interface User {
  name: string;
  sekolah: string;
  profile: string;
}

const ProfileScreen: React.FC = () => {
  const [profile, setProfile] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [user, setUser] = useState<User>({ name: '', sekolah: '', profile: '' });
  const [cardInTime, setCardInTime] = useState<string>('N/A');
  const [cardOutTime, setCardOutTime] = useState<string>('N/A');
  const [completedTodos, setCompletedToDos] = useState<number>(0);

  useEffect(() => {
    const getTokenAndFetchUser = async () => {
      const token = await AsyncStorage.getItem('authToken');
      setAuthToken(token);
      fetchUser(token);
      fetchAttendance(token);
    };
    getTokenAndFetchUser();
  }, []);

  const fetchUser = async (token: string | null) => {
    try {
      const response = await axios.get('https://attendance-pkl.aviraster.com/api/users/profile', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      setUser(response.data);
      if (response.data.profile) {
        setProfile(response.data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchAttendance = async (token: string | null) => {
    try {
      const response = await axios.get('https://attendance-pkl.aviraster.com/api/attendance', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (Array.isArray(response.data)) {
        const today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
        const todayAttendance = response.data.filter((record) =>
          moment(record.in).tz('Asia/Jakarta').format('YYYY-MM-DD') === today
        );

        if (todayAttendance.length > 0) {
          const firstRecord = todayAttendance[0];
          const inTime = firstRecord.in ? moment(firstRecord.in) : null;
          const outTime = firstRecord.out ? moment(firstRecord.out) : null;

          setCardInTime(inTime ? inTime.format('hh:mm A') : 'N/A');
          setCardOutTime(outTime ? outTime.format('hh:mm A') : 'N/A');
        } else {
          setCardInTime('N/A');
          setCardOutTime('N/A');
        }
      }
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    }
  };

  const fetchToDoList = async (token: string | null) => {
    try {
      const response = await axios.get('https://attendance-pkl.aviraster.com/api/todolist', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const todos = response.data.todos || [];
      const completedCount = todos.filter(todo => todo.status === 'Completed').length;
      setCompletedToDos(completedCount);
    } catch (error) {
      console.error('Failed to fetch to-do list data:', error.response ? error.response.data : error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const getTokenAndFetchUser = async () => {
        const token = await AsyncStorage.getItem('authToken');
        setAuthToken(token);
        if (token) {
          fetchUser(token);
          fetchAttendance(token);
          fetchToDoList(token);
        }
      };
      getTokenAndFetchUser();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUser(authToken).finally(() => setRefreshing(false));
  }, [authToken]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0];
      const extension = uri.split('.').pop().toLowerCase();
      const mime = extension === 'png' ? 'image/png' : 'image/jpeg';

      const base64Image = `data:${mime};base64,${result.assets[0].base64}`;
      uploadImage(base64Image);
    }
  };

  const uploadImage = async (base64Image: string) => {
    try {
      const response = await axios.post(
        'https://attendance-pkl.aviraster.com/api/users/profile-image',
        {
          profile_image: base64Image,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );
      setProfile(base64Image);
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Error', 'An error occurred while uploading the image. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      const response = await axios.post(
        'https://attendance-pkl.aviraster.com/api/logout',
        {},
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.message === 'Successfully logged out') {
        await AsyncStorage.removeItem('authToken');
        router.push('/login'); // Using expo-router's push method for navigation
      } else {
        Alert.alert('Error', 'An error occurred while logging out.');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'An error occurred while logging out. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <LinearGradient colors={['#00509F', '#001D39']} style={styles.header}>
          <View style={styles.profileContainer}>
            <Image
              source={profile ? { uri: profile } : require('@/assets/images/img/profil.jpeg')}
              style={styles.profile}
            />
            <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
              <Ionicons name="pencil" size={20} color="black" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{user.name || 'Nama tidak ditemukan'}</Text>
          <Text style={styles.school}>{user.sekolah || 'Not found'}</Text>
        </LinearGradient>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Get In</Text>
            <Text style={styles.statValue}>{cardInTime}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>To-Do List</Text>
            <Text style={styles.statValue}>{completedTodos}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Get Out</Text>
            <Text style={styles.statValue}>{cardOutTime}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Link href="/about" style={styles.menuItem}>
            <Ionicons name="person" size={24} color="#000" style={styles.menuIcon} />
            <Text style={styles.menuText}>Tentang akun</Text>
            <View style={{ flexDirection: 'row-reverse', flex: 1 }}>
              <Ionicons name="arrow-forward" size={20} color="#6B6B6B" />
            </View>
          </Link>
          <Link href="/pass" style={styles.menuItem}>
            <Ionicons name="key" size={24} color="#000" style={styles.menuIcon} />
            <Text style={styles.menuText}>Kata sandi</Text>
            <View style={{ flexDirection: 'row-reverse', flex: 1 }}>
              <Ionicons name="arrow-forward" size={20} color="#6B6B6B" />
            </View>
          </Link>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Link href="/home" style={styles.iconContainer}>
          <Ionicons name="home" size={28} color="#666666" />
        </Link>
        <Link href="/attendance" style={styles.iconContainer}>
          <Ionicons name="newspaper" size={28} color="#666666" />
        </Link>
        <Link href="/scan" style={styles.iconContainer}>
          <Ionicons name="camera-sharp" size={29} color="#666666" />
        </Link>
        <Link href="/todo" style={styles.iconContainer}>
          <Ionicons name="book" size={28} color="#666666" />
        </Link>
        <Link href="/profile" style={styles.iconContainer}>
          <Ionicons name="person" size={28} color="#00509F" />
        </Link>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingTop: 80,
  },
  profileContainer: {
    position: 'relative',
  },
  profile: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  editIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#EDF3FF',
    borderRadius: 20,
    padding: 4,
  },
  name: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  school: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: '#fff',
    paddingVertical: 10,
    marginHorizontal: 20,
    borderRadius: 10,
    marginTop: -40,
    marginBottom: 20,
    alignItems: 'center'
  },
  statItem: {
    alignItems: 'center',
    marginTop: 10
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 13,
    color: '#9FA0A4',
    fontWeight: 'bold',
  },
  body: {
    flex: 1,
    backgroundColor: '#EDF3FF',
    borderRadius: 15,
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 80,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#fff',
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  menuIcon: {
    marginRight: 10,
    color: '#6B6B6B'
  },
  menuText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#EDF3FF',
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 50,
  },
  logoutText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  iconContainer: {
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: '50%',
    backgroundColor: '#d3d3d3',
    marginHorizontal: 10,
  },
});

export default ProfileScreen;