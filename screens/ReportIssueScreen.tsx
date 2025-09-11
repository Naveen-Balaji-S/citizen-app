import React, { useState } from "react";
import { 
    View, Text, ImageBackground, StyleSheet, Alert, TouchableOpacity, 
    TextInput, Modal, ScrollView, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, MapPressEvent } from "react-native-maps";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from "../navigation/AppNavigator";
import { supabase } from '../lib/supabaseClient';
import { decode } from 'base64-arraybuffer';

// Credentials for Cloudinary from your .env file
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@env";

// Types
interface LocationType {
  latitude: number;
  longitude: number;
}

type ReportIssueScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReportForm'>;

export default function ReportIssueScreen() {
    const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [department, setDepartment] = useState<string>("");
    const [location, setLocation] = useState<LocationType | null>(null);
    const [description, setDescription] = useState<string>("");
    const [mapVisible, setMapVisible] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigation = useNavigation<ReportIssueScreenNavigationProp>();

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
            base64: true,
        });
        if (!result.canceled) setImage(result.assets[0]);
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission required", "Camera access is needed to take a photo.");
            return;
        }
        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
            base64: true,
        });
        if (!result.canceled) setImage(result.assets[0]);
    };
    
    const fetchLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission required", "Location access is needed to get your current position.");
            return;
        }
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
        });
    };

    const handleMapPress = (e: MapPressEvent) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setLocation({ latitude, longitude });
        setMapVisible(false);
    };
    
    const removeImage = () => setImage(null);

    // This is the updated submitReport function with both Cloudinary and Supabase logic
    const submitReport = async () => {
        if (!image || !department || !location || !description.trim()) {
            Alert.alert("Missing Information", "Please fill out all fields, including a photo, department, description, and location.");
            return;
        }
        setIsSubmitting(true);

        try {
            if (!image.base64) throw new Error("Image data is missing.");
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found. Please log in again.");

            let imageUrl = '';

           
            // --- OPTION 2: SUPABASE STORAGE UPLOAD (Currently Commented Out) ---
            
            const fileExt = image.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
            const filePath = `${user.id}/${Date.now()}.${fileExt}`;
            const contentType = `image/${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('report_images')
                .upload(filePath, decode(image.base64), { contentType });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage
                .from('report_images')
                .getPublicUrl(filePath);
            if (!urlData) throw new Error("Could not get image URL from Supabase.");
            imageUrl = urlData.publicUrl;
            
           
            // --- INSERT THE REPORT INTO SUPABASE DATABASE ---
            const { error: insertError } = await supabase.from('reports').insert({
                user_id: user.id,
                department,
                description,
                latitude: location.latitude,
                longitude: location.longitude,
                image_url: imageUrl, // Uses the URL from the active service above
                status: 'Not Completed',
            });

            if (insertError) throw insertError;

            navigation.navigate('Success');

        } catch (error: any) {
            console.error("Submission Error:", error);
            Alert.alert("Submission Error", error.message || "An unknown error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
            // Adjust behavior based on the operating system
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.container}>
                    <Text style={styles.title}>File a New Report</Text>
                    
                    {/* Photo Section */}
                    <View style={styles.card}>
                        <Text style={styles.label}>1. Add a Photo</Text>
                        {image?.uri ? (
                            <ImageBackground source={{ uri: image.uri }} style={styles.imagePreview} imageStyle={{ borderRadius: 10 }}>
                                <TouchableOpacity style={styles.deleteBtn} onPress={removeImage}>
                                    <Ionicons name="close-circle" size={32} color="#fff" />
                                </TouchableOpacity>
                            </ImageBackground>
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                                    <Ionicons name="images-outline" size={24} color="#007bff" />
                                    <Text style={styles.photoButtonText}>Choose from Gallery</Text>
                                </TouchableOpacity>
                                 <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                                    <Ionicons name="camera-outline" size={24} color="#007bff" />
                                    <Text style={styles.photoButtonText}>Take Photo</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Details Section */}
                    <View style={styles.card}>
                        <Text style={styles.label}>2. Provide Details</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker selectedValue={department} onValueChange={(itemValue) => setDepartment(itemValue)}>
                                <Picker.Item label="Select Department..." value="" />
                                <Picker.Item label="Electricity" value="Electricity" />
                                <Picker.Item label="Sewage" value="Sewage" />
                                <Picker.Item label="Roads" value="Roads" />
                                <Picker.Item label="Water Supply" value="Water Supply" />
                                <Picker.Item label="Sanitation" value="Sanitation" />
                            </Picker>
                        </View>

                        <View style={styles.descriptionContainer}>
                            <TextInput style={styles.textInput} placeholder="Describe the issue in detail..." value={description} onChangeText={setDescription} multiline />
                            <TouchableOpacity style={styles.micButton}>
                                <Ionicons name="mic-outline" size={24} color="#8e8e93" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Location Section */}
                    <View style={styles.card}>
                        <Text style={styles.label}>3. Set Location</Text>
                         <View style={styles.locationButtons}>
                            <TouchableOpacity style={styles.locationBtn} onPress={fetchLocation}>
                                <Ionicons name="navigate-circle-outline" size={20} color="#fff" />
                                <Text style={styles.btnText}>Use Current Location</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.locationBtn, { backgroundColor: "#6c757d" }]} onPress={() => setMapVisible(true)}>
                                <Ionicons name="map-outline" size={20} color="#fff" />
                                <Text style={styles.btnText}>Select on Map</Text>
                            </TouchableOpacity>
                        </View>
                        {location && <Text style={styles.locationText}>Location selected: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</Text>}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity style={[styles.submitBtn, isSubmitting && styles.disabledBtn]} onPress={submitReport} disabled={isSubmitting}>
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Report</Text>}
                    </TouchableOpacity>
                    
                    {/* Map Modal */}
                    <Modal visible={mapVisible} animationType="slide">
                        <View style={{ flex: 1 }}>
                            <MapView style={{ flex: 1 }} initialRegion={{ latitude: 13.0827, longitude: 80.2707, latitudeDelta: 0.2, longitudeDelta: 0.2, }} onPress={handleMapPress}>
                                {location && <Marker coordinate={location} />}
                            </MapView>
                            <TouchableOpacity style={styles.closeMapButton} onPress={() => setMapVisible(false)}>
                                <Text style={styles.submitText}>Close Map</Text>
                            </TouchableOpacity>
                        </View>
                    </Modal>
                </View>
            </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#f0f2f5" },
    scrollContainer: { flexGrow: 1, paddingVertical: 10 },
    container: { flex: 1, paddingHorizontal: 15 },
    title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 20, color: '#1c1c1e' },
    card: { 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        padding: 15, 
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    label: { fontSize: 18, fontWeight: "600", marginBottom: 12, color: '#343a40' },
    photoPlaceholder: {
        height: 150,
        borderRadius: 10,
        backgroundColor: '#e9ecef',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    photoButton: {
        alignItems: 'center',
        marginHorizontal: 20,
    },
    photoButtonText: {
        marginTop: 5,
        color: '#007bff',
        fontWeight: '600',
    },
    imagePreview: {
        width: "100%", 
        height: 200, 
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    deleteBtn: { 
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        margin: 5,
    },
    pickerWrapper: { 
        borderWidth: 1, 
        borderColor: "#ced4da", 
        borderRadius: 8,
        marginBottom: 15,
    },
    descriptionContainer: {
        position: 'relative',
    },
    textInput: { 
        borderWidth: 1, 
        borderColor: "#ced4da", 
        borderRadius: 8, 
        padding: 12, 
        minHeight: 100, 
        fontSize: 16,
        textAlignVertical: 'top',
        paddingRight: 40,
    },
    micButton: {
        position: 'absolute',
        right: 10,
        top: 12,
    },
    locationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    locationBtn: { 
        backgroundColor: "#007bff", 
        paddingVertical: 12, 
        borderRadius: 8, 
        alignItems: "center", 
        flex: 1, 
        marginHorizontal: 5, 
        flexDirection: 'row',
        justifyContent: 'center'
    },
    btnText: { color: "#fff", fontSize: 15, fontWeight: "600", marginLeft: 8 },
    locationText: { marginTop: 15, fontSize: 14, color: "#28a745", textAlign: 'center', fontWeight: '500' },
    submitBtn: { backgroundColor: "#28a745", padding: 15, borderRadius: 10, alignItems: 'center' },
    submitText: { color: "#fff", fontSize: 18, textAlign: "center", fontWeight: "bold" },
    disabledBtn: { backgroundColor: '#9fdaab' },
    closeMapButton: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: "#dc3545",
        padding: 15,
        borderRadius: 10,
    }
});

