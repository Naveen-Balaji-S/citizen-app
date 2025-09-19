import React, { useState, useEffect } from "react";
import { 
    View, Text, ImageBackground, StyleSheet, Alert, TouchableOpacity, 
    TextInput, Modal, ScrollView, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { Ionicons } from "@expo/vector-icons";
import { WebView } from 'react-native-webview';
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
    const [departmentId, setDepartmentId] = useState<number | null>(null);
    const [location, setLocation] = useState<LocationType | null>(null);
    const [description, setDescription] = useState<string>("");
    const [mapVisible, setMapVisible] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
    const [playbackSound, setPlaybackSound] = useState<Audio.Sound | null>(null);
    const navigation = useNavigation<ReportIssueScreenNavigationProp>();

    useEffect(() => {
        const fetchDepartments = async () => {
            const { data, error } = await supabase.from('departments').select('id, name');
            if (error) {
                console.error("Failed to fetch departments:", error.message);
            } else {
                setDepartments(data || []);
            }
        };
        fetchDepartments();
    }, []);

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
    
    const removeImage = () => setImage(null);

    // --- Audio Recording Functions ---
    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission required", "Audio recording access is needed.");
                return;
            }
            if (playbackSound) {
                await playbackSound.unloadAsync();
                setPlaybackSound(null);
            }
            setRecordedAudioUri(null);

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            const newRecording = new Audio.Recording();
            await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            await newRecording.startAsync();
            setRecording(newRecording);
            setIsRecording(true);
            Alert.alert("Recording", "Recording has started. Tap the stop icon to finish.");
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert("Recording Error", "Failed to start recording. Please try again.");
            setIsRecording(false);
        }
    };

    const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
        await recording.stopAndUnloadAsync();
        
        // This is a key step to ensure the audio session is ready for playback.
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            interruptionModeIOS: 1,
            interruptionModeAndroid: 1,
            shouldDuckAndroid: true,
        });

        const uri = recording.getURI();
        setRecording(null);
        if (uri) {
            setRecordedAudioUri(uri);
            Alert.alert("Recording Saved", "Audio recording has been saved.");
        }
    } catch (err) {
        console.error('Failed to stop recording', err);
        Alert.alert("Recording Error", "Failed to stop recording. Please try again.");
    }
};

    const playRecordedAudio = async () => {
    if (!recordedAudioUri) {
        Alert.alert("No Audio", "There is no recorded audio to play.");
        return;
    }

    if (playbackSound) {
        await playbackSound.unloadAsync();
        setPlaybackSound(null);
    }

    try {
        // Re-confirm playback mode just to be safe.
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            interruptionModeIOS: 1,
            interruptionModeAndroid: 1,
            shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
            { uri: recordedAudioUri },
            { shouldPlay: true }
        );
        setPlaybackSound(sound);

        sound.setOnPlaybackStatusUpdate(status => {
            if (status.isLoaded && status.didJustFinish) {
                sound.unloadAsync();
                setPlaybackSound(null);
            }
        });
    } catch (err) {
        console.error('Failed to play sound', err);
        Alert.alert("Playback Error", "Failed to play the recorded audio. Check permissions and file access.");
    }
};

    const deleteRecordedAudio = async () => {
        if (playbackSound) {
            await playbackSound.unloadAsync();
            setPlaybackSound(null);
        }
        setRecordedAudioUri(null);
        Alert.alert("Recording Deleted", "The recorded audio has been deleted.");
    };

    const handleMicPress = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };
    // ------------------------------------

    const submitReport = async () => {
        if (isRecording) {
            Alert.alert("Please wait", "Please stop the audio recording first.");
            return;
        }

        if (!image || departmentId === null || !location || !description.trim()) {
            Alert.alert("Missing Information", "Please fill out all fields, including a photo, department, description, and location.");
            return;
        }
        setIsSubmitting(true);

        try {
            if (!image.base64) throw new Error("Image data is missing.");
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found. Please log in again.");

            // --- IMAGE UPLOAD ---
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
            const imageUrl = urlData.publicUrl;
            
            // --- AUDIO UPLOAD (If a recording exists) ---
            let audioUrl = null;
            if (recordedAudioUri) {
                const audioExt = recordedAudioUri.split('.').pop()?.toLowerCase() ?? 'm4a';
                const audioPath = `${user.id}/audio_${Date.now()}.${audioExt}`;
                const audioBase64 = await FileSystem.readAsStringAsync(recordedAudioUri, { encoding: FileSystem.EncodingType.Base64 });
                const audioArrayBuffer = decode(audioBase64);

                const { error: audioUploadError } = await supabase.storage
                    .from('report_audio')
                    .upload(audioPath, audioArrayBuffer, { contentType: `audio/${audioExt}` });
                if (audioUploadError) throw audioUploadError;

                const { data: audioUrlData } = supabase.storage
                    .from('report_audio')
                    .getPublicUrl(audioPath);
                if (!audioUrlData) throw new Error("Could not get audio URL from Supabase.");
                audioUrl = audioUrlData.publicUrl;
            }
            
            // --- INSERT THE REPORT INTO SUPABASE DATABASE ---
            const { error: insertError } = await supabase.from('reports').insert({
                user_id: user.id,
                department_id: departmentId,
                description,
                latitude: location.latitude,
                longitude: location.longitude,
                image_url: imageUrl,
                audio_url: audioUrl,
                status: 'Submitted',
            });

            if (insertError) throw insertError;

            navigation.navigate('Success');

            await supabase.from('user_notifications').insert({
                user_id: user.id,
                title: 'Report Submitted',
                body: `Your report "${description}" has been submitted successfully.`,
                is_read: false,
            });

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
                            <Picker selectedValue={departmentId} onValueChange={(itemValue) => setDepartmentId(itemValue)}>
                                <Picker.Item label="Select Department..." value={null} />
                                {departments.map((dept) => (
                                    <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
                                ))}
                            </Picker>
                        </View>
                        <View style={styles.descriptionContainer}>
                            <TextInput 
                                style={styles.textInput} 
                                placeholder="Describe the issue in detail..." 
                                value={description} 
                                onChangeText={setDescription} 
                                multiline 
                            />
                            <TouchableOpacity style={styles.micButton} onPress={handleMicPress}>
                                <Ionicons 
                                    name={isRecording ? "stop-circle-outline" : "mic-outline"} 
                                    size={24} 
                                    color={isRecording ? '#dc3545' : '#8e8e93'} 
                                />
                            </TouchableOpacity>
                        </View>
                        {recordedAudioUri && (
                            <View style={styles.audioControlsContainer}>
                                <TouchableOpacity style={styles.playButton} onPress={playRecordedAudio}>
                                    <Ionicons name="play-circle-outline" size={24} color="#fff" />
                                    <Text style={styles.playButtonText}>Play Audio</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteButton} onPress={deleteRecordedAudio}>
                                    <Ionicons name="trash-outline" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Location Section */}
                    <View style={styles.card}>
                        <Text style={styles.label}>3. Set Location</Text>
                        <View style={styles.locationButtons}>
                            <TouchableOpacity style={styles.locationBtn} onPress={fetchLocation}>
                                <Ionicons name="navigate-circle-outline" size={20} color="#fff" />
                                <Text style={styles.btnText}>Use Current Location</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.locationBtn, { backgroundColor: "#6c757d" }]}
                                onPress={() => setMapVisible(true)}
                            >
                                <Ionicons name="map-outline" size={20} color="#fff" />
                                <Text style={styles.btnText}>Select on Map</Text>
                            </TouchableOpacity>
                        </View>
                        {location && (
                            <Text style={styles.locationText}>
                                Location selected: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                            </Text>
                        )}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity style={[styles.submitBtn, isSubmitting && styles.disabledBtn]} onPress={submitReport} disabled={isSubmitting}>
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Report</Text>}
                    </TouchableOpacity>
                    
                    {/* Map Modal with OpenStreetMap */}
                    <Modal visible={mapVisible} animationType="slide">
                        <WebView
                            originWhitelist={['*']}
                            source={require('../assets/leafletMap.html')}
                            onMessage={(event) => {
                                const { lat, lng } = JSON.parse(event.nativeEvent.data);
                                setLocation({ latitude: lat, longitude: lng });
                                setMapVisible(false);
                            }}
                            style={{ flex: 1 }}
                        />
                        <TouchableOpacity
                            style={styles.closeMapButton}
                            onPress={() => setMapVisible(false)}
                        >
                            <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>
                            Close Map
                            </Text>
                        </TouchableOpacity>
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
    attribution: {
        position: 'absolute',
        bottom: 8,
        alignSelf: 'center',
        fontSize: 12,
        color: '#333',
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 6,
        borderRadius: 4
    },
    closeMapButton: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: "#dc3545",
        padding: 15,
        borderRadius: 10,
    },
    audioControlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    playButton: {
        backgroundColor: '#007bff',
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        marginRight: 10,
    },
    playButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
    },
});