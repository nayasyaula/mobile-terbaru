import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl, Linking, Platform, LayoutChangeEvent } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';
import { Link } from 'expo-router';

interface Todo {
  id: number;
  content: string;
  keterangan: string;
  pesan: string;
  date: string;
  status: string;
}

const ToDoListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isMonthDropdownVisible, setMonthDropdownVisible] = useState<boolean>(false);
  const [isAllDropdownVisible, setAllDropdownVisible] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('Month');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('');  
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [monthButtonLayout, setMonthButtonLayout] = useState<any>(null);
  const [filterButtonLayout, setFilterButtonLayout] = useState<any>(null);

  // Fetch To-Do list
  const fetchToDoList = async () => {
    console.log('Fetching to-do list...');
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('No token found');

      const response = await axios.get('https://attendance-pkl.aviraster.com/api/todolist', {
        headers: { 
            Authorization: `Bearer ${token}`
        },
      });

      console.log('Fetched todos:', response.data);
      setTodos(response.data);
      setFilteredTodos(response.data.todos || []);
    } catch (error: any) {
      console.error('Error fetching to-do list:', error.response ? error.response.data : error.message);
      Alert.alert('Error', 'Failed to fetch to-do list. Please try again.');
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    console.log('Date String:', dateString);
    return moment(dateString).format('ddd, D MMMM YYYY');
  };

  // Function to get status text color
  const getStatusTextColor = (status: string, type: string) => {
    if (type === 'in') {
      return status === 'On Time' ? 'blue' : 'red';
    } else if (type === 'out') {
      return status === 'Izin' ? 'red' : 'blue';
    }
    return '#000000';
  };

  // Function to get icon and color based on status
  const getIconAndColor = (status: string, type: string) => {
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

  // Fetch document
  const fetchDocument = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('No token found');

      const response = await axios.get('https://attendance-pkl.aviraster.com/api/attendance/create-document', {
        headers: {
          Authorization: `Bearer ${token}`
        },
      });
      console.log('Document fetched successfully:', response.data);

      const { fileName, fileContent } = response.data.data;
      return { fileName, fileContent };
    } catch (error: any) {
      console.error('Error fetching document:', error.message);
      return null;
    }
  };

  // Download file
  const downloadFile = async () => {
    const fileData = await fetchDocument();
    if (fileData) {
      const { fileName, fileContent } = fileData;
      const fileUri = FileSystem.documentDirectory + fileName;
      console.log('Saving file to:', fileUri);

      try {
        await FileSystem.writeAsStringAsync(fileUri, fileContent, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Download Complete',
            body: `File ${fileName} has been downloaded successfully.`,
            data: { uri: fileUri },
          },
          trigger: null,
        });

        Alert.alert(
          'Success',
          'File downloaded successfully. What would you like to do?',
          [
            { text: 'Open', onPress: () => openFile(fileUri) },
            { text: 'Share', onPress: () => shareFile(fileUri) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } catch (error: any) {
        console.log('Error writing file:', error);
        Alert.alert('Error', 'Failed to download file');
      }
    } else {
      console.log('Error: No file data received');
      Alert.alert('Error', 'No file data received');
    }
  };

  // Open file
  const openFile = async (fileUri: string) => {
    try {
      if (!fileUri) {
        throw new Error('File URI is invalid');
      }

      const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          type: mimeType,
          flags: 1,
        });
      } else if (Platform.OS === 'ios') {
        Linking.openURL(fileUri);
      } else {
        throw new Error('Unsupported platform');
      }
    } catch (error: any) {
      console.error('Error opening file:', error);
      Alert.alert('Error', `Error opening file: ${error.message}`);
    }
  };

  // Share file
  const shareFile = async (fileUri: string) => {
    try {
      if (!fileUri) {
        throw new Error('File URI is invalid');
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    } catch (error: any) {
      console.error('Error sharing file:', error);
      Alert.alert('Error', `Error sharing file: ${error.message}`);
    }
  };

  // On refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchToDoList();
    setRefreshing(false);
  };

  useEffect(() => {
    setCurrentDate(moment().format('ddd, D MMMM YYYY')); // Set the current date when component mounts
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchToDoList(); // Fetch data when the screen gains focus
    }, [fetchToDoList])
  );

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const filters = ['All'];

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setMonthDropdownVisible(false);
    if (month === 'Month') {
      setFilteredTodos(todos);
    } else {
      const monthIndex = months.indexOf(month);
      const filtered = todos.filter(todo => moment(todo.date).month() === monthIndex);
      setFilteredTodos(filtered);
    }
  };

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    setAllDropdownVisible(false);
    if (filter === 'All') {
      setFilteredTodos(todos);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={24} color="black" style={styles.icon} />
          <Text style={styles.dateText}>{currentDate}</Text>
        </View>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.filterItem}
            onPress={() => setAllDropdownVisible(!isAllDropdownVisible)}
            onLayout={(event) => setFilterButtonLayout(event.nativeEvent.layout)}
          >
            <Text style={styles.filterText}>{selectedFilter}</Text>
            <Ionicons name="swap-vertical-outline" size={20} color="black" style={styles.icon1} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterItem}
            onPress={() => setMonthDropdownVisible(!isMonthDropdownVisible)}
            onLayout={(event) => setMonthButtonLayout(event.nativeEvent.layout)}
          >
            <Text style={styles.filterText}>{selectedMonth}</Text>
            <Ionicons name="arrow-down-outline" size={20} color="#666666" style={styles.icon1} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterItem1} onPress={downloadFile}>
            <View style={styles.iconBox}>
            <Ionicons name="download" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.todoListContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.line} />

        {/* Dropdown Menus */}
        {isMonthDropdownVisible && monthButtonLayout && (
          <View style={[styles.dropdownContainer, {
            top: monthButtonLayout.y + monthButtonLayout.height + 40,
            left: monthButtonLayout.x,
          }]}>
            {months.map((month, index) => (
              <TouchableOpacity key={index} style={styles.dropdownItem} onPress={() => handleMonthSelect(month)}>
                <Text style={styles.dropdownText}>{month}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {isAllDropdownVisible && filterButtonLayout && (
          <View style={[styles.dropdownContainer, {
            top: filterButtonLayout.y + filterButtonLayout.height + 40,
            left: filterButtonLayout.x,
          }]}>
            {filters.map((filter, index) => (
              <TouchableOpacity key={index} style={styles.dropdownItem} onPress={() => handleFilterSelect(filter)}>
                <Text style={styles.dropdownText}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* To-Do List */}
        <View style={styles.sections}>
            
                <View style={styles.dateSection}>
                    <View style={styles.textContainer}>
                        <Text style={styles.dateText1}>Membuat desain poster dan compro</Text>
                        <Text style={[styles.statusText, { color: '#001A6E', fontWeight: 'bold'  }]}>Wed, 17 July 2024</Text>
                    </View>
                    <Ionicons name="book" size={32} color="#001A6E" style={styles.incomingIcon} />
                    <View style={styles.line1} />
                </View>
            
        </View>
        
      </ScrollView>

      <TouchableOpacity style={styles.circleButton} onPress={() => navigation.navigate('CreateToDoList')}>
        <LinearGradient colors={['#001D39', '#00509F']} style={styles.gradientCircle}>
          <Ionicons name="add" size={30} color="white" />
        </LinearGradient>
      </TouchableOpacity>

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
          <Ionicons name="book" size={28} color="#00509F" />
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
      paddingHorizontal: 16,
      paddingTop: 50,
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
  },
  dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: -38,
  },
  icon: {
      marginHorizontal: 8,
  },
  dateText: {
      fontSize: 15,
  },
  filterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 24,
      flex: 1,
      justifyContent: 'space-evenly',
  },
  filterItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1,
      marginHorizontal: 4,
  },
  filterText: {
      fontSize: 15,
      marginRight: 2,
      color: '#000000',
      fontWeight: 'bold',
  },
  icon1: {
      marginHorizontal: 4,
      marginLeft: 1,
  },
  iconBox: {
      width: 30,
      height: 30,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#00509F',
  },
  filterItem1: {
      marginHorizontal: 4,
  },
  dropdownContainer: {
      position: 'absolute',
      backgroundColor: 'white',
      borderRadius: 8,
      borderColor: '#e0e0e0',
      borderWidth: 1,
      zIndex: 1000,
      width: 100,
      marginLeft: 180,
      marginTop: 40,
  },
  dropdownItem: {
      padding: 10,
  },
  dropdownText: {
      fontSize: 14,
  },
  sections: {
      flexGrow: 1,
      paddingBottom: 80,
  },
  noTodos: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888888',
  },
  textContainer: {
      flex: 1,
      justifyContent: 'center',
  },
  dateSection: {
      marginBottom: 1,
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
  statusText: {
      fontSize: 14,
      marginTop: 4,
  },
  incomingIcon: {
      position: 'absolute',
      right: 0,
      top: 0,
      marginTop: 10,
      marginRight: 10,
  },
  line: {
      borderBottomWidth: 8,
      borderBottomColor: '#EDF3FF',
      width: '100%',
      marginBottom: 16,
  },
  line1: {
      borderBottomWidth: 1,
      borderBottomColor: '#D9D9D9',
      marginVertical: 8,
      position: 'relative',
      width: '100%',
      // marginTop: -1,
  },
  footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 30,
  },
  iconContainer: {
      alignItems: 'center',
  },
  circleButton: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradientCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ToDoListScreen;