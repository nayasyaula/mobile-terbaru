import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import moment from 'moment-timezone';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';

type User = {
  name: string;
  profile?: string;
};

type AttendanceRecord = {
  in: string | null;
  out: string | null;
  in_status: string;
  out_status: string;
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [user, setUser] = useState<User>({ name: '' });
  const [todayAttendanceData, setTodayAttendanceData] = useState<AttendanceRecord[]>([]);
  const [cardInTime, setCardInTime] = useState<string>('N/A');
  const [cardOutTime, setCardOutTime] = useState<string>('N/A');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);

  const fetchUser = useCallback(async (token: string) => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  }, []);

  const fetchTodayAttendance = async (token: string) => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/attendance', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(response.data)) {
        const today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
        const todayAttendance = response.data.filter((record: AttendanceRecord) =>
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

        setTodayAttendanceData(todayAttendance);
      }
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    }
  };

  const fetchAttendance = async (token: string) => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/attendance', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(response.data) && response.data.length > 0) {
        setAttendanceData(response.data);
      } else {
        setAttendanceData([]);
      }
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          await fetchUser(token);
          await fetchAttendance(token);
          await fetchTodayAttendance(token);
        }
      };
      fetchData();
    }, [fetchUser, fetchAttendance, fetchTodayAttendance])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    AsyncStorage.getItem('authToken')
      .then((token) => {
        if (token) {
          fetchUser(token);
          fetchAttendance(token);
          fetchTodayAttendance(token);
        }
      })
      .finally(() => setRefreshing(false));
  }, [fetchUser, fetchAttendance, fetchTodayAttendance]);

  useEffect(() => {
    const updateTime = () => {
      const now = moment().tz('Asia/Jakarta');
      setCurrentTime(now.format('HH:mm'));
      setCurrentDate(now.format('ddd, D MMMM YYYY'));
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    AsyncStorage.getItem('authToken').then((token) => {
      if (token) {
        fetchUser(token);
        fetchAttendance(token);
        fetchTodayAttendance(token);
      }
    });

    return () => clearInterval(intervalId);
  }, [fetchUser, fetchAttendance, fetchTodayAttendance]);

  const getIconAndColor = (status: string, type: 'in' | 'out') => {
    if (type === 'in') {
      return {
        icon: status === 'On Time' ? 'log-in' : 'log-in',
        color: status === 'On Time' ? 'red' : 'blue',
      };
    } else if (type === 'out') {
      return {
        icon: status === 'Izin' ? 'log-out' : 'log-out',
        color: status === 'Izin' ? 'red' : 'blue',
      };
    }
    return { icon: 'log-in', color: 'black' };
  };

  const getStatusTextColor = (status: string, type: 'in' | 'out') => {
    if (type === 'in') {
      return status === 'On Time' ? 'blue' : 'red';
    } else if (type === 'out') {
      return status === 'Izin' ? 'red' : 'blue';
    }
    return '#000000';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello, {user.name}!</Text>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={24} color="black" style={styles.icon} />
              <Text style={styles.dateText}>{currentDate}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Ionicons name="notifications-outline" size={24} color="black" style={styles.icon} />
            <Image
              source={user.profile ? { uri: user.profile } : require('@/assets/images/img/profil.jpeg')}
              style={styles.profilePic}
            />
          </View>
        </View>

        <View style={styles.cardContainer}>
          <LinearGradient colors={['#001D39', '#00509F']} style={styles.cardGradient}>
            <View style={styles.cardContentLeft}>
              <Text style={styles.cardTime}>{currentTime}</Text>
              <Text style={styles.cardLocation}>Bogor, Indonesia</Text>
            </View>
            <Text style={styles.cardLabelRight}>Hari Ini</Text>
          </LinearGradient>

          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardText}>Get In</Text>
              <Text style={styles.cardTime1}>{cardInTime}</Text>
              <Text style={styles.cardStatus}>{todayAttendanceData.length > 0 ? todayAttendanceData[0].in_status : 'N/A'}</Text>
            </View>
            <Ionicons
              name={getIconAndColor(todayAttendanceData.length > 0 ? todayAttendanceData[0].in_status : 'N/A', 'in').icon}
              size={40}
              color={getIconAndColor(todayAttendanceData.length > 0 ? todayAttendanceData[0].in_status : 'N/A', 'in').color}
              style={styles.cardIcon1}
            />
          </View>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ToDoList')}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>On Time</Text>
              <Text style={styles.cardSubtitle}>Completing The Teks</Text>
            </View>
            <Ionicons name="clipboard" size={30} color="black" style={styles.cardIcon1} />
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardText}>Get Out</Text>
              <Text style={styles.cardTime1}>{cardOutTime}</Text>
              <Text style={styles.cardStatus}>{todayAttendanceData.length > 0 ? todayAttendanceData[0].out_status : 'N/A'}</Text>
            </View>
            <Ionicons
              name={getIconAndColor(todayAttendanceData.length > 0 ? todayAttendanceData[0].out_status : 'N/A', 'out').icon}
              size={40}
              color={getIconAndColor(todayAttendanceData.length > 0 ? todayAttendanceData[0].out_status : 'N/A', 'out').color}
              style={styles.cardIcon1}
            />
          </View>
        </View>
        <View style={styles.activitiesContainer}>
          <Text style={styles.activitiesText}>Top of Your List!</Text>
          <View style={styles.line} />
          <View style={styles.activitiesHeadContainer}>
            <Text style={styles.activitiesText1}>Recent Activity</Text>
            <Text style={styles.activitiesText2}>See More</Text>
          </View>

          {attendanceData.length === 0 ? (
            <Text style={styles.noAttendance}>No attendance records available</Text>
          ) : (
            attendanceData.map((item, index) => {
              const inIconAndColor = getIconAndColor(item.in_status, 'in');
              const outIconAndColor = getIconAndColor(item.out_status, 'out');

              const icon = item.out_status ? outIconAndColor.icon : inIconAndColor.icon;
              const color = item.out_status ? outIconAndColor.color : inIconAndColor.color;
              const statusTextColor = getStatusTextColor(item.out_status, 'out');

              return (
                <View key={index} style={styles.dateSection}>
                  <View style={styles.textContainer}>
                    <Text style={styles.dateText1}>
                      {item.in ? moment(item.in).format('ddd, D MMMM YYYY') : 'No date'}
                    </Text>
                    <Text style={[styles.statusText, { color: statusTextColor }]}>
                      {item.out_status ? 'Outgoing Presence' : 'Incoming Presence'}
                    </Text>
                  </View>
                  <Ionicons name={icon} size={32} color={color} style={styles.incomingIcon} />
                  <View style={styles.line1} />
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
      <Link href="/home" style={styles.iconContainer}>
        <Ionicons name="home" size={28} color="#00509F" />
      </Link>
      <Link href="/attendance" style={styles.iconContainer}>
        <Ionicons name="newspaper" size={28} color="#666666" />
      </Link>
      <Link href="/scan" style={styles.iconContainer}>
        <Ionicons name="qr-code-sharp" size={29} color="#666666" />
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
    paddingTop: 50, // Add top padding to avoid close proximity to status bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  activitiesText: {
    fontSize: 20,
    marginTop: 8,
    fontWeight: 'bold',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: -8,
  },
  icon: {
    marginHorizontal: 8,
  },
  dateText: {
    fontSize: 15,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 30,
    marginLeft: 8,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardGradient: {
    flexBasis: '48%',
    maxWidth: '48%',
    height: 85,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 3,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardContentLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  cardTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 12,
    color: 'white',
  },
  cardLabelRight: {
    fontSize: 13,
    color: 'white',
  },
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    maxWidth: '48%',
    height: 85,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 3,
    backgroundColor: '#EDF3FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  cardTime1: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
    textAlign: 'left',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
    textAlign: 'left',
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'left',
  },
  cardStatus: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'left',
  },
  cardIcon1: {
    marginLeft: 10,
  },
  line: {
    borderBottomWidth: 9,
    borderBottomColor: '#EDF3FF',
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },
  activitiesContainer: {
    marginTop: 16,
    flex: 1,
    marginBottom: 20,
  },
  activitiesHeadContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activitiesText1: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  activitiesText2: {
    fontSize: 14,
  },
  noAttendance: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888888',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  line1: {
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
    marginVertical: 8,
    position: 'relative',
    width: '100%',
  },
  dateSection: {
    marginBottom: 4,
    flexDirection: 'column',
    alignItems: 'flex-start',
    position: 'relative',
  },
  dateText1: {
    color: '#000000',
    fontSize: 14,
    marginTop: 4,
    fontWeight: 'bold',
  },
  incomingPresenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  incomingPresenceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  incomingIcon: {
    position: 'absolute',
    right: 0,
    top: 0,
    marginTop: 7,
    marginRight: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  iconContainer: {
    alignItems: 'center',
  },
});

export default HomeScreen;
