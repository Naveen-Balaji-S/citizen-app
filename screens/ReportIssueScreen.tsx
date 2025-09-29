import React, { useState, useEffect, useRef } from "react";
import { 
    View, Text, ImageBackground, Button,StyleSheet, Alert, TouchableOpacity, 
    TextInput, Modal, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { Ionicons } from "@expo/vector-icons";
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from "../navigation/AppNavigator";
import { supabase } from '../lib/supabaseClient';
import { decode } from 'base64-arraybuffer';
import MapView, { UrlTile, Region } from 'react-native-maps';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next'; // <-- Hook is here

// Types
interface LocationType {
    latitude: number;
    longitude: number;
}

type ReportIssueScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReportForm'>;
type ReportFormRouteProp = RouteProp<RootStackParamList, 'ReportForm'>;


export default function ReportIssueScreen() {
    const { t } = useTranslation(); // <-- Initialize translation hook

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
    const [mapRegion, setMapRegion] = useState<Region | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null); 
     const [isPlaying, setIsPlaying] = useState(false);

    const mapRef = useRef<MapView>(null);
    const route = useRoute<ReportFormRouteProp>();
    

    useEffect(() => {
        const draft = route.params?.draft;
        if (draft) {
            // Pre-populate the form state with data from the draft
            if (draft.image) setImage(draft.image);
            if (draft.departmentId) setDepartmentId(draft.departmentId);
            if (draft.location) setLocation(draft.location);
            if (draft.description) setDescription(draft.description);
            if (draft.recordedAudioUri) setRecordedAudioUri(draft.recordedAudioUri);
            if (draft.id) setCurrentDraftId(draft.id);
            // Use translation for toast
            Toast.show({ type: "info", text1: t('drafts.title'), text2: t('drafts.edit_continue') });
        }
    }, [route.params?.draft, t]); // Add t to dependency array

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

    const handleSaveDraft = async () => {
        try {
            const draftId = currentDraftId || Date.now().toString();
            const draft = {
                id: draftId,
                image,
                departmentId,
                location,
                description,
                recordedAudioUri,
                savedAt: new Date().toISOString(),
            };
            await AsyncStorage.setItem(`@draft_report_${draft.id}`, JSON.stringify(draft));
            setCurrentDraftId(draftId);

            Toast.show({
                type: 'customSuccess',
                text1: t('report_issue.alert_draft_saved'),
                text2: t('report_issue.alert_draft_saved'), // Using same key for both fields
            });
        } catch (e) {
            // Use general error key from i18n
            Alert.alert(t('error'), t('drafts.delete_error')); 
        }
    };

    const handleSaveDraftAndNavigate = async () => {
        await handleSaveDraft();
        // Small delay to ensure toast is visible before navigation
        setTimeout(() => {
            navigation.navigate('Home');
        }, 1000);
    };


    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            // Use translation keys for Alert
            Alert.alert(t('report_issue.alert_permission_required'), t('report_issue.alert_camera_access_needed')); 
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
            // Use translation keys for Alert
            Alert.alert(t('report_issue.alert_permission_required'), t('report_issue.alert_location_access_needed_get')); 
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
                // Use translation keys for Alert
                Alert.alert(t('report_issue.alert_permission_required'), t('report_issue.alert_audio_access_needed')); 
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
            // Use translation keys for Alert
            Alert.alert(t('report_issue.alert_recording_title'), t('report_issue.alert_recording_started_message')); 
        } catch (err) {
            console.error('Failed to start recording', err);
            // Use translation keys for Alert
            Alert.alert(t('error'), t('report_issue.alert_failed_to_start_recording')); 
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
            // Use translation keys for Alert
            Alert.alert(t('report_issue.alert_recording_saved_title'), t('report_issue.alert_recording_saved_message')); 
        }
    } catch (err) {
        console.error('Failed to stop recording', err);
        // Use translation keys for Alert
        Alert.alert(t('error'), t('report_issue.alert_failed_to_stop_recording')); 
    }
    };

    const playRecordedAudio = async () => {
    if (!recordedAudioUri) {
        // Use translation keys for Alert
        Alert.alert(t('report_issue.alert_no_audio_title'), t('report_issue.alert_no_audio_message')); 
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
        setIsPlaying(true);

        sound.setOnPlaybackStatusUpdate(status => {
            if (status.isLoaded) {
                setIsPlaying(status.isPlaying); // Update state based on actual playback

                // When the audio finishes, unload it and reset the state
                if (status.didJustFinish) {
                    sound.unloadAsync();
                    setPlaybackSound(null);
                    setIsPlaying(false);
                }
            }
        });
    } catch (err) {
        console.error('Failed to play sound', err);
        // Use translation keys for Alert
        Alert.alert(t('report_issue.alert_playback_error_title'), t('report_issue.alert_playback_error_message')); 
    }
    };

    const deleteRecordedAudio = async () => {
        if (playbackSound) {
            await playbackSound.unloadAsync();
            setPlaybackSound(null);
        }
        setRecordedAudioUri(null);
        // Use translation keys for Alert
        Alert.alert(t('report_issue.alert_recording_deleted_title'), t('report_issue.alert_recording_deleted_message')); 
    };

    const handleMicPress = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    // --- Search Logic (No debouncing) ---
    const handleSearch = async () => {
        
        if (searchQuery.length < 3) {
            // Use translation keys for Alert
            Alert.alert(t('report_issue.alert_missing_info_title'), "Please enter at least 3 characters to search.");
            return;
        }
        // --- ADD THIS LINE: Define the bounding box for Chennai ---
        // Format is: minLongitude,minLatitude,maxLongitude,maxLatitude
        const chennaiBbox = '80.15,12.95,80.35,13.20';

        const apiKey = process.env.EXPO_PUBLIC_MAPTILER_API_KEY;
        const proximity = mapRegion ? `${mapRegion.longitude},${mapRegion.latitude}` : 'auto';
        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(searchQuery)}.json?key=${apiKey}&proximity=${proximity}&bbox=${chennaiBbox}`;

        try {
            const response = await fetch(url);
            const json = await response.json();
            setSearchResults(json.features || []);
        } catch (error) {
            console.error("Failed to fetch search results:", error);
            // Use general error key for Alert
            Alert.alert(t('error'), "Could not fetch search results.");
        }
    };

    const handleResultPress = (result: any) => {
    const [longitude, latitude] = result.center;
    
    // Animate the map to the selected location
    mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01, // Zoom in
        longitudeDelta: 0.01,
    }, 1000); // Animate over 1 second

    // Clean up the UI
    setSearchResults([]);
    setSearchQuery(result.place_name);
    };
    
    const submitReport = async () => {
        if (isRecording) {
            // Use translation keys for Alert
            Alert.alert(t('report_issue.alert_wait_title'), t('report_issue.alert_stop_recording_first_message')); 
            return;
        }

        if (!image || departmentId === null || !location || !description.trim()) {
            // Use translation keys for Alert
            Alert.alert(t('report_issue.alert_missing_info_title'), t('report_issue.alert_missing_info_message')); 
            return;
        }
        // --- NEW: Check for internet connection ---
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
            await handleSaveDraft(); // Save as a draft if offline
            // Show the specific toast message for failed submission
            Toast.show({
                type: 'error', // Use an error or warning type
                text1: t('error'), // Use general error key
                text2: t('report_issue.alert_draft_saved'), // Using a translation for a friendly message
            });
            // Stop submission
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(true);

        try {
            if (!image.base64) throw new Error("Image data is missing.");
            
            const { data: { user } } = await supabase.auth.getUser();
            // Use translation key for error message
            if (!user) throw new Error(t('login_failed_title'));

            // --- NEW: CALL EDGE FUNCTION TO GET WARD ID ---
            const { data: functionData, error: functionError } = await supabase.functions.invoke('get-ward-from-coords', {
                body: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                },
            });

            if (functionError) throw functionError;

            const wardId = functionData.wardId;
            if (!wardId) {
                // Use translation key for error message
                throw new Error("This location is not within a valid ward. Please select a different location."); // Specific message without key, keep as is
            }

            // Upload image
            const fileExt = image.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
            const filePath = `${user.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('report_images')
                .upload(filePath, decode(image.base64), { contentType: `image/${fileExt}` });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('report_images').getPublicUrl(filePath);
            const imageUrl = urlData.publicUrl;

            // Upload audio if exists
            let audioUrl = null;
            if (recordedAudioUri) {
                const audioExt = recordedAudioUri.split('.').pop() ?? "m4a";
                const audioPath = `${user.id}/audio_${Date.now()}.${audioExt}`;
                const audioBase64 = await FileSystem.readAsStringAsync(recordedAudioUri, { encoding: "base64" });
                const audioArrayBuffer = decode(audioBase64);
                await supabase.storage.from("report_audio").upload(audioPath, audioArrayBuffer, { contentType: `audio/${audioExt}` });
                const { data: audioUrlData } = supabase.storage.from("report_audio").getPublicUrl(audioPath);
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
                ward_id: wardId,
            });

            if (insertError) throw insertError;

            if (currentDraftId) {
                try {
                    await AsyncStorage.removeItem(`@draft_report_${currentDraftId}`);
                } catch (e) {
                    console.log('Could not delete draft after successful submission:', e);
                }
            }

            // Use translation keys for Success Toast
            Toast.show({
                type: 'customSuccess',
                text1: t('success'),
                text2: t('report_submitted_success')
            });

            setTimeout(() => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            }, 2000);

            // Use translation keys for Notification
            await supabase.from('user_notifications').insert({
                user_id: user.id,
                title: t('report_issue.supabase_notification_title'),
                body: t('report_issue.supabase_notification_body', { description: description }),
                is_read: false,
            });
            // navigation.navigate("Home"); // Removed duplicate navigation
        } catch (error: any) {
            console.error("Submission Error:", error);
            // Use translation keys for Alert
            Alert.alert(t('report_issue.alert_submission_error_title'), error.message || t('report_issue.alert_unknown_error_message'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openMapSelector = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            // Use translation keys for Alert
            Alert.alert(t('report_issue.alert_permission_required'), t('report_issue.alert_location_access_needed_get'));
            return;
        }
        let currentPos = await Location.getCurrentPositionAsync({});
        // Set the initial region of the map to the user's current location
        setMapRegion({
            latitude: currentPos.coords.latitude,
            longitude: currentPos.coords.longitude,
            latitudeDelta: 0.01, // Zoom level
            longitudeDelta: 0.01, // Zoom level
        });
        setMapVisible(true);
    };

    // --- NEW FUNCTION to handle confirming the location from the map modal ---
    const onConfirmLocation = () => {
        if (mapRegion) {
            setLocation({
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude,
            });
        }
        setMapVisible(false);
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {/* Use translation for screen title */}
                    <Text style={styles.title}>{t('report_issue.title')}</Text>
                    
                    {/* Photo Section */}
                    <View style={styles.card}>
                        {/* Use translation for section header */}
                        <Text style={styles.label}>{t('report_issue.section_photo')}</Text>
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
                                    {/* Use translation for button text */}
                                    <Text style={styles.photoButtonText}>{t('report_issue.choose_gallery')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                                    <Ionicons name="camera-outline" size={24} color="#007bff" />
                                    {/* Use translation for button text */}
                                    <Text style={styles.photoButtonText}>{t('report_issue.take_photo')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                    
                    {/* Details Section */}
                    <View style={styles.card}>
                        {/* Use translation for section header */}
                        <Text style={styles.label}>{t('report_issue.section_details')}</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker selectedValue={departmentId} onValueChange={(itemValue) => setDepartmentId(itemValue as number | null)}>
                                {/* Use translation for picker placeholder */}
                                <Picker.Item label={t('report_issue.select_department')} value={null} />
                                {departments.map((dept) => (
                                    <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
                                ))}
                            </Picker>
                        </View>
                        <View style={styles.descriptionContainer}>
                            <TextInput 
                                style={styles.textInput} 
                                // Use translation for text input placeholder
                                placeholder={t('report_issue.description_placeholder')} 
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
                                <TouchableOpacity 
                                    style={[styles.playButton, isPlaying && { backgroundColor: '#0056b3' }]} // Optional: change color when playing
                                    onPress={playRecordedAudio}
                                    disabled={isPlaying} // Optional: disable button while playing
                                >
                                    <Ionicons 
                                        name={isPlaying ? "pause-circle-outline" : "play-circle-outline"} // 👈 DYNAMIC ICON
                                        size={24} 
                                        color="#fff" 
                                    />
                                    <Text style={styles.playButtonText}>
                                        {/* Use translation for button text */}
                                        {isPlaying ? 'Playing...' : t('report_issue.play_audio')} {/* 👈 DYNAMIC TEXT */}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteButton} onPress={deleteRecordedAudio}>
                                    <Ionicons name="trash-outline" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Location Section */}
                    <View style={styles.card}>
                        {/* Use translation for section header */}
                        <Text style={styles.label}>{t('report_issue.section_location')}</Text>
                        <View style={styles.locationButtons}>
                            <TouchableOpacity style={styles.locationBtn} onPress={fetchLocation}>
                                <Ionicons name="navigate-circle-outline" size={20} color="#fff" />
                                {/* Use translation for button text */}
                                <Text style={styles.btnText}>{t('report_issue.use_current_location')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.locationBtn, { backgroundColor: "#6c757d" }]}
                                onPress={openMapSelector}
                            >
                                <Ionicons name="map-outline" size={20} color="#fff" />
                                {/* Use translation for button text */}
                                <Text style={styles.btnText}>{t('report_issue.select_on_map')}</Text>
                            </TouchableOpacity>
                        </View>
                        {location && (
                            <Text style={styles.locationText}>
                                {/* Use translation and interpolation for location text */}
                                {t('report_issue.location_selected', { 
                                    latitude: location.latitude.toFixed(4), 
                                    longitude: location.longitude.toFixed(4) 
                                })}
                            </Text>
                        )}
                    </View>

                    <View style={styles.actionButtonContainer}>
                        <TouchableOpacity style={styles.saveExitButton} onPress={handleSaveDraftAndNavigate}>
                            <Ionicons name="save-outline" size={20} color="#fff" />
                            {/* Use translation for button text */}
                            <Text style={styles.draftButtonText}>{t('report_issue.save_draft')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.submitButton, isSubmitting && styles.disabledBtn]} 
                            onPress={submitReport} 
                            disabled={isSubmitting}
                        >
                            {isSubmitting 
                            ? <ActivityIndicator color="#fff" /> 
                            // Use translation for button text
                            : <Text style={styles.btnText}>🚀 {t('report_issue.submit_report')}</Text>}
                        </TouchableOpacity>
                    </View>

                    
                    <Modal visible={mapVisible} animationType="slide">
                        <SafeAreaView style={{ flex: 1 }}>
                            <View style={{ flex: 1 }}>
                                <MapView
                                    ref={mapRef}
                                    style={styles.map}
                                    region={mapRegion}
                                    onRegionChangeComplete={(region) => setMapRegion(region)} // Update region as user moves map
                                >
                                    <UrlTile
                                        urlTemplate={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${process.env.EXPO_PUBLIC_MAPTILER_API_KEY}`}
                                        maximumZ={19}
                                    />
                                </MapView>

                                <View style={styles.searchContainer}>
                                    <View style={styles.searchBarWrapper}>
                                        <TextInput
                                            // Hardcoded placeholder for search is fine if no key exists
                                            placeholder={"Search for a location..."} 
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            style={styles.searchInput}
                                        />
                                        
                                        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                                            <Ionicons name="search" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                    
                                    {searchResults.length > 0 && (
                                        <FlatList
                                            data={searchResults}
                                            keyExtractor={(item) => item.id}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={styles.resultItem}
                                                    onPress={() => handleResultPress(item)}
                                                >
                                                    <Text>{item.place_name}</Text>
                                                </TouchableOpacity>
                                            )}
                                            style={styles.resultsList}
                                        />
                                    )}
                                </View>

                                {/* This is the pin that stays in the center of the screen */}
                                <View style={styles.mapPinContainer}>
                                    <Ionicons name="location" size={40} color="#dc3545" />
                                </View>

                                {/* These are the action buttons at the bottom */}
                                <View style={styles.mapActionsContainer}>
                                    <TouchableOpacity style={styles.confirmMapButton} onPress={onConfirmLocation}>
                                        {/* Use translation for button text */}
                                        <Text style={styles.btnText}>{t('report_issue.confirm_location')}</Text>
                                    </TouchableOpacity>
                                       <TouchableOpacity style={styles.closeMapButton} onPress={() => setMapVisible(false)}>
                                        {/* Use translation for button text */}
                                        <Text style={styles.btnText}>{t('report_issue.cancel')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </SafeAreaView>
                    </Modal>
            </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#f0f2f5" },
scrollContainer: { 
        flexGrow: 1, 
        paddingVertical: 20, // Added more vertical padding
        paddingHorizontal: 15,
        paddingBottom: 50,
    },    container: { flex: 1, paddingHorizontal: 15 },
    title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 20, color: '#1c1c1e' },
    actionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
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
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    mapPinContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -12, // Half the icon width (approx)
        marginTop: -40, // The full icon height to position it above the center point
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapActionsContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    saveExitButton: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#6c757d", // Grey
  paddingVertical: 15,
  marginRight: 8,
  borderRadius: 10,
},
submitButton: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#28a745", // Green
  paddingVertical: 15,
  marginLeft: 8,
  borderRadius: 10,
},

    confirmMapButton: {
        backgroundColor: "#28a745",
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
    },
    closeMapButton: { // Style for the new cancel button
        backgroundColor: "#6c757d",
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
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
    quickSaveButton: {
        flex: 1,
        backgroundColor: "#17a2b8",
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginLeft: 8,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    quickSaveButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
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
    searchContainer: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    zIndex: 1, // Ensure it's on top of the map
},

resultsList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 5,
    maxHeight: 200, // Limit the height of the results list
},
resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
},
    searchBarWrapper: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    searchInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
    },
    searchButton: {
        padding: 12,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
    },
    actionButtonContainer: {
        flexDirection: 'row',
        marginTop: 10,
    },
    draftButton: {
        flex: 1,
        backgroundColor: "#6c757d",
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginRight: 10,
    },
    draftButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    submitBtn: {
        flex: 2, // Make submit button larger
        backgroundColor: "#28a745",
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },

});