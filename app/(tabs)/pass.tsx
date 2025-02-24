import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PasswordOneScreen({ navigation }) {
    const [password, setPassword] = useState('');
    const [authToken, setAuthToken] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const getTokenAndFetchUser = async () => {
            const token = await AsyncStorage.getItem('authToken');
            setAuthToken(token);
        };
        getTokenAndFetchUser();
    }, []);

    const handleNext = async () => {
        if (!authToken) {
            Alert.alert('Error', 'Authentication token is missing.');
            return;
        }

        try {
            const response = await axios.post('https://attendance-pkl.aviraster.com/api/users/verify-password', {
                password: password,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                }
            });

            if (response.data.success) {
                navigation.navigate('Password2');
            } else {
                Alert.alert('Error', 'Incorrect password.');
            }
        } catch (error) {
            console.error('Password verification failed:', error.response ? error.response.data : error.message);
            Alert.alert('Error', 'An error occurred while verifying the password. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={24} onPress={() => navigation.goBack()} />
                <Text style={styles.headerText}>Kata Sandi</Text>
            </View>
            <View style={styles.form}>
                <Text style={styles.label}>Kata Sandi</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Masukkan Kata Sandi"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={24}
                        color="gray"
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                    />
                </View>
                <Text style={styles.hint}>Masukkan sandi sebelumnya</Text>
            </View>
            <TouchableOpacity style={styles.buttonContainer} onPress={handleNext}>
                <LinearGradient
                    colors={['#00509F', '#001D39']}
                    style={styles.gradient}
                >
                    <Text style={styles.buttonText}>Lanjut</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerText: {
        marginLeft: 120,
        fontSize: 18,
        fontWeight: 'bold',
    },
    form: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#00509F',
        borderWidth: 1,
        borderRadius: 30,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 50,
    },
    input: {
        flex: 1,
    },
    eyeIcon: {
        marginLeft: 10,
    },
    hint: {
        fontSize: 14,
        color: '#666',
    },
    buttonContainer: {
        width: '100%',
        borderRadius: 25,
        marginTop: 'auto',
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