import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TextInput, TouchableOpacity, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AboutAccountScreen({ navigation }) {
    const [user, setUser] = useState();
    // const [loading, setLoading] = useState(true);
    const [editableField, setEditableField] = useState('');
    const [editableValue, setEditableValue] = useState('');
    const [isEditing, setIsEditing] = useState({});

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                const response = await axios.get('https://attendance-pkl.aviraster.com/api/users/profile', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setUser(response.data);
            } catch (error) {
                console.error('Failed to fetch user data:', error);
                setUser({}); // Set user to empty object on error
            } 
            // finally {
            //     setLoading(false);
            // }
        };
        fetchUser();
    }, []);

    const handleSave = async (field) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await axios.put('https://attendance-pkl.aviraster.com/api/users/update', {
                [field]: editableValue,
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            // Perbarui state dengan data pengguna yang baru
            setUser(prevUser => ({ ...prevUser, [field]: editableValue }));
            setIsEditing({});
            setEditableValue(''); // Clear the editable value
        } catch (error) {
            console.error('Failed to update user data:', error);
            Alert.alert('Error', 'Failed to update user data. Please try again.');
        }
    };

    // if (loading) {
    //     return (
    //         <View style={styles.loadingContainer}>
    //             <ActivityIndicator size="large" color="#00509F" />
    //         </View>
    //     );
    // }

    const renderField = (icon, label, field) => (
        <View style={styles.inputContainer} key={field}>
            <Ionicons name={icon} size={20} color="#666" style={styles.icon} />
            <Text style={styles.label}>{label}</Text>
            {isEditing[field] ? (
                <TextInput
                    style={styles.valueInput}
                    value={editableValue}
                    onChangeText={setEditableValue}
                    onBlur={() => {
                        setIsEditing({ ...isEditing, [field]: false });
                        handleSave(field);
                    }}
                    autoFocus
                />
            ) : (
                <TouchableOpacity onPress={() => {
                    setEditableField(field);
                    setEditableValue(user ? user[field] || '' : '');
                    setIsEditing({ ...isEditing, [field]: true });
                }}>
                    <Text style={styles.value}>
                        {user ? user[field] || 'N/A' : 'N/A'} {/* Display the value here */}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );    

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Ionicons name="arrow-back" size={24} onPress={() => navigation.goBack()} />
                    <Text style={styles.headerText}>Tentang Akun</Text>
                </View>
                <View style={styles.section}>
                    <Text style={styles.title}>Informasi Pribadi</Text>
                </View>
                <View style={styles.card}>
                    {renderField('person', 'Nama Lengkap', 'name')}
                    {renderField('mail', 'Email', 'email')}
                    {renderField('call', 'No. Telepon', 'telp')}
                    {renderField('calendar', 'Tanggal Lahir', 'tanggal_lahir')}
                    {renderField('location', 'Tempat Lahir', 'tempat_lahir')}
                    {renderField('transgender', 'Jenis Kelamin', 'jenis_kelamin')}
                    {renderField('information-circle', 'Status', 'status')}
                    {renderField('people', 'Agama', 'agama')}
                    {renderField('school', 'Sekolah', 'sekolah')}
                    {renderField('home', 'Alamat', 'alamat')}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EDF3FF',
        paddingTop: 50,
    },
    scrollContainer: {
        flex: 1,
        padding: 15,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerText: {
        marginLeft: 10,
        fontSize: 18,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    label: {
        fontSize: 14,
        color: '#333',
        flexGrow: 1,
    },
    value: {
        fontSize: 14,
        color: '#666',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        width: '100%',
    },
    valueInput: {
        fontSize: 14,
        color: '#666',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        flex: 2,
        width: '100%',
    },
    icon: {
        marginRight: 10,
        color: '#00509F',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});