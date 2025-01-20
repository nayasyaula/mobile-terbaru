import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { useController, useForm, SubmitHandler, FieldValues } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Loading from '../../components/loading';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().nonempty("Email is required").email("Email must be valid"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
    telp: z.string().min(11, "Phone number must be at least 11 characters"),
    tempat_lahir: z.string().nonempty("Place of birth is required"),
    tanggal_lahir: z.string().nonempty("Date of birth is required"),
    jenis_kelamin: z.string().nonempty("Gender is required"),
    status: z.string().nonempty("Status is required"),
    jurusan: z.string().nonempty("Major is required"),
    sekolah: z.string().nonempty("School is required"),
    agama: z.string().nonempty("Religion is required"),
    alamat: z.string().nonempty("Address is required"),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // path of error
});

interface RegisterScreenProps {
    navigation: any;
}

function Input({ name, control, placeholder, secureTextEntry, errors }: any) {
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
                secureTextEntry={secureTextEntry && !showPassword}
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

function PickerInput({ name, control, options, placeholder, errors }: any) {
    const { field } = useController({
        control,
        name,
        defaultValue: ""
    });

    return (
        <>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={field.value}
                    onValueChange={field.onChange}
                    style={styles.picker}
                >
                    <Picker.Item label={placeholder} value="" />
                    {options.map((option) => (
                        <Picker.Item key={option.value} label={option.label} value={option.value} />
                    ))}
                </Picker>
            </View>
            {errors[name] && <Text style={styles.errorText}>{errors[name]?.message}</Text>}
        </>
    );
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateOfBirth, setDateOfBirth] = useState(new Date());

    const { control, handleSubmit, formState: { errors }, setValue } = useForm({
        resolver: zodResolver(formSchema)
    });

    const onSubmit: SubmitHandler<FieldValues> = async (data) => {
        console.log('Data to be sent:', data);
        
        // Format the date
        const formattedData = {
            ...data,
            tanggal_lahir: moment(data.tanggal_lahir, 'DD MMMM YYYY').format('YYYY-MM-DD'),
            password_confirmation: data.confirmPassword,
        };
        
        setLoading(true);
        try {
            const response = await axios.post('https://attendance-pkl.aviraster.com/api/register', formattedData);
            console.log('API Response:', response.data);
    
            // Successful registration
            if (response.data.token) {
                Alert.alert('Success', 'Registration successful');
                navigation.navigate('Home');
            } else {
                Alert.alert('Error', response.data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('API Error:', error);
            if (error.response) {
                console.error('API Error Data:', error.response.data);
    
                // Display specific error messages from the API response
                if (error.response.data.errors) {
                    const errorMessage = Object.values(error.response.data.errors).flat().join('\n');
                    Alert.alert('Error', errorMessage);
                } else {
                    Alert.alert('Error', 'An error occurred during registration');
                }
            } else {
                Alert.alert('Error', 'An error occurred during registration');
            }
        } finally {
            setLoading(false);
        }
    };
    

    const handleDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || dateOfBirth;
        setShowDatePicker(false);
        const formattedDate = moment(currentDate).format('DD MMMM YYYY');
        setDateOfBirth(currentDate);  // Update to Date object
        setValue('tanggal_lahir', formattedDate);
    };

    return (
        <>
            {loading && <Loading />}
            <ScrollView contentContainerStyle={styles.container}>
                <Image source={require('@/assets/images/logo2.png')} style={styles.image} />
                <Text style={styles.heading}>Create your account</Text>
                <Input name="name" control={control} placeholder="Name" errors={errors} />
                <Input name="email" control={control} placeholder="Email" errors={errors} />
                <Input name="password" control={control} placeholder="Password" secureTextEntry={true} errors={errors} />
                <Text style={styles.confirmText}>Confirm your password</Text>
                <Input name="confirmPassword" control={control} placeholder="Confirm Password" secureTextEntry={true} errors={errors} />
                <Input name="telp" control={control} placeholder="Phone" errors={errors} />
                <Input name="tempat_lahir" control={control} placeholder="Place of Birth" errors={errors} />
                
                <TouchableOpacity
                    style={styles.inputContainer}
                    onPress={() => setShowDatePicker(true)}
                >
                    <TextInput
                        placeholder="Date of Birth"
                        value={moment(dateOfBirth).format('DD MMMM YYYY')}  // Ensure it's formatted correctly
                        style={styles.input}
                        editable={false}
                    />
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={dateOfBirth}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}
                <PickerInput
                    name="jenis_kelamin"
                    control={control}
                    placeholder="Gender"
                    errors={errors} 
                    options={[{ value: "Perempuan", label: "Perempuan" }, { value: "Laki-laki", label: "Laki-laki" }]}
                />
                <PickerInput
                    name="status"
                    control={control}
                    placeholder="Status"
                    errors={errors}
                    options={[{ value: "Pelajar", label: "Pelajar" }, { value: "Mahasiswa", label: "Mahasiswa" }, { value: "Pekerja", label: "Pekerja" }]}
                />
                <PickerInput
                    name="jurusan"
                    control={control}
                    placeholder="Major"
                    errors={errors}
                    options={[{ value: "DKV", label: "DKV" }, { value: "TJKT", label: "TJKT" }, { value: "PPLG", label: "PPLG" }]}
                />
                <PickerInput
                    name="sekolah"
                    control={control}
                    placeholder="School"
                    errors={errors}
                    options={[{ value: "SMK Wikrama Bogor", label: "SMK Wikrama Bogor" }, { value: "SMKN 3 BOGOR", label: "SMKN 3 BOGOR" }]}
                />
                <PickerInput
                    name="agama"
                    control={control}
                    placeholder="Religion"
                    errors={errors}
                    options={[{ value: "Islam", label: "Islam" }, { value: "Kristen", label: "Kristen" }, { value: "Katolik", label: "Katolik" }, { value: "Hindu", label: "Hindu" }, { value: "Buddha", label: "Buddha" }, { value: "Konghucu", label: "Konghucu" }]}
                />
                <Input name="alamat" control={control} placeholder="Address" errors={errors} />
                <TouchableOpacity style={styles.buttonContainer} onPress={handleSubmit(onSubmit)}>
                    <LinearGradient
                        colors={['#00509F', '#001D39']}
                        style={styles.gradient}
                    >
                        <Text style={styles.buttonText}>Register</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 20,
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
    pickerContainer: {
        width: '90%',
        height: 50,
        borderColor: '#00509F',
        borderWidth: 1,
        borderRadius: 30,
        marginBottom: 15,
        justifyContent: 'center',
    },
    picker: {
        width: '100%',
        height: '100%',
    },
    errorText: {
        color: 'red',
        alignSelf: 'flex-start',
        marginLeft: 25,
        marginBottom: 20,
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
    eyeIcon: {
        position: 'absolute',
        right: 15,
        top: 15,
    },
});

export default RegisterScreen;