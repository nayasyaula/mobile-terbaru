import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useForm, useController, FieldValues, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Loading from '../../components/loading';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router'; // Import useRouter from Expo Router

// Define schema for form validation using Zod
const formSchema = z.object({
    email: z.string().min(1, "Email is required").email("Email must be valid"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

// Define types for Input props
type InputProps = {
    name: 'email' | 'password'; // Specify the valid field names
    control: Control<FieldValues, any>;
    placeholder: string;
    secureTextEntry?: boolean;
    errors: Record<string, { message?: string }>;
};

function Input({ name, control, placeholder, secureTextEntry, errors }: InputProps) {
    const { field } = useController({
        control,
        name,
        defaultValue: ""
    });

    const [showPassword, setShowPassword] = useState(secureTextEntry);

    return (
        <View style={styles.inputContainer}>
            <TextInput
                placeholder={placeholder}
                onChangeText={field.onChange}
                value={field.value}
                style={styles.input}
                secureTextEntry={secureTextEntry && showPassword}
            />
            {secureTextEntry && (
                <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color="gray"
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                />
            )}
            {errors[name] && <Text style={styles.errorText}>{errors[name]?.message}</Text>}
        </View>
    );
}

type LoginScreenProps = {
    navigation: any; // Remove the navigation prop if not needed with Expo Router
};

export default function Login() {
    const [loading, setLoading] = useState(false);
    const router = useRouter(); // Initialize useRouter for navigation

    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(formSchema)
    });

    const onSubmit = async (data: { email: string; password: string }) => {
        setLoading(true);
        try {
            const response = await axios.post('https://attendance-pkl.aviraster.com/api/login', data, {
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (response.status === 200) {
                const { token } = response.data;
                await AsyncStorage.setItem('authToken', token);
                router.push('/home'); // Use router.push to navigate
            } else {
                Alert.alert('Login Failed', 'Invalid email or password');
            }
        } catch (error: any) {
            console.error('Error details:', error);
            Alert.alert('Login Failed', 'Internal Server Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {loading && <Loading />}
            <View style={styles.container}>
                <Image source={require('@/assets/images/logo2.png')} style={styles.image} />
                <Text style={styles.heading}>Welcome back!</Text>
                <Input
                    name="email"
                    control={control}
                    placeholder="Email"
                    errors={errors}
                    secureTextEntry={false}
                />
                <Input
                    name="password"
                    control={control}
                    placeholder="Password"
                    errors={errors}
                    secureTextEntry={true}
                />
                <Text style={styles.confirmText}>Please enter your credentials</Text>
                <TouchableOpacity style={styles.buttonContainer} onPress={handleSubmit(onSubmit)}>
                    <LinearGradient
                        colors={['#00509F', '#001D39']}
                        style={styles.gradient}
                    >
                        <Text style={styles.buttonText}>Log in</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.registerText}>
                    Don't have an account?
                    <Text style={styles.registerLink} onPress={() => router.push('/signUp')}> Sign up</Text>
                </Text>
            </View>
        </>
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
    heading: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 20,
        lineHeight: 21,
        letterSpacing: -0.32,
        color: '#00000099',
    },
    inputContainer: {
        width: '90%',
        position: 'relative',
        marginBottom: 15,
    },
    input: {
        height: 50,
        borderColor: '#00509F',
        borderWidth: 1,
        borderRadius: 30,
        paddingHorizontal: 15,
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
        top: 15,
    },
    errorText: {
        color: 'red',
        alignSelf: 'flex-start',
        marginLeft: 15,
        marginTop: 5,
    },
    confirmText: {
        alignSelf: 'flex-start',
        marginLeft: 25,
        marginBottom: 20,
        color: '#666',
    },
    buttonContainer: {
        width: '90%',
        borderRadius: 25,
        marginTop: 10,
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
    registerText: {
        marginTop: 20,
        color: '#666',
    },
    registerLink: {
        color: '#00509F',
        fontWeight: 'bold',
    },
});
