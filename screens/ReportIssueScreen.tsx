import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, MapPressEvent } from "react-native-maps";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from "../navigation/AppNavigator";
import * as SecureStore from 'expo-secure-store'; // Import SecureStore
import { API_URL } from "../config/apiConfig"; 

// Types
interface LocationType {
  latitude: number;
  longitude: number;
}

type ReportIssueScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReportForm'>;

export default function ReportIssueScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [department, setDepartment] = useState<string>("");
  const [location, setLocation] = useState<LocationType | null>(null);
  const [description, setDescription] = useState<string>("");

  const [mapVisible, setMapVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigation = useNavigation<ReportIssueScreenNavigationProp>();

  // Pick image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Take photo
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera access is needed.");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 📍 Get current GPS location
  const fetchLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Location access is needed.");
      return;
    }
    let currentLocation = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    });
  };

  // 🗺 Handle map press
  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLocation({ latitude, longitude });
    setMapVisible(false);
  };

  // 🗑 Delete chosen image
  const removeImage = () => {
    setImage(null);
  };

// Submit form
const submitReport = async () => {
  if (!image || !department || !location || !description.trim()) {
    Alert.alert("Missing Info", "Please complete all fields.");
    return;
  }

  setIsSubmitting(true);

  try {
    // 2. Create a FormData object. This is our "digital package".
    const formData = new FormData();

    // 3. Add all the text details to the package.
    formData.append('department', department);
    formData.append('description', description);
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());

    // 4. Add the image file to the package.
    // 'report_image' is the key the server will look for.
    formData.append('report_image', {
      uri: image,
      name: `photo_${Date.now()}.jpg`, // Create a unique name
      type: `image/jpeg`,
    } as any); 
    
    const token = await SecureStore.getItemAsync('user_token');
      if (!token) {
        throw new Error("You are not logged in.");
      }

    const response = await fetch(`${API_URL}/api/reports`, {
      method: 'POST',
      body: formData,
      // This header is essential! It tells the server to expect files.
      headers: {
        'Content-Type': 'multipart/form-data',
        // We will add the login token here in a later step
        'Authorization': `Bearer ${token}`
      },
    });
    // 6. Handle the server's response.
    if (!response.ok) {
      // If the server sent back an error, show it.
      const errorData = await response.json();
      throw new Error(errorData.error || "An unknown server error occurred.");
    }
    
    // If successful, go to the Success screen.
    navigation.navigate('Success');

  } catch (error: any) {
    console.error("Submission Error:", error);
    Alert.alert("Submission Error", error.message);
  } finally {
    // 7. Re-enable the submit button.
    setIsSubmitting(false);
  }
};

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>📢 Report a Civic Issue</Text>

        {/* Upload Photo */}
        <View style={styles.section}>
          <Text style={styles.label}>Upload a Photo:</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <Text style={styles.btnText}>Choose in Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={takePhoto}>
              <Text style={styles.btnText}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          {image && (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: image }} style={styles.image} />
              <TouchableOpacity style={styles.deleteBtn} onPress={removeImage}>
                <Ionicons name="close-circle" size={28} color="red" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Department */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Department:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={department}
              onValueChange={(itemValue) => setDepartment(itemValue)}
            >
              <Picker.Item label="-- Select Department --" value="" />
              <Picker.Item label="Electricity" value="Electricity" />
              <Picker.Item label="Sewage" value="Sewage" />
              <Picker.Item label="Roads" value="Roads" />
              <Picker.Item label="Water Supply" value="Water Supply" />
              <Picker.Item label="Sanitation" value="Sanitation" />
            </Picker>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Issue Description:</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Describe the issue..."
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Location:</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.locationBtn} onPress={fetchLocation}>
              <Text style={styles.btnText}>Current Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.locationBtn, { backgroundColor: "#6f42c1" }]}
              onPress={() => setMapVisible(true)}
            >
              <Text style={styles.btnText}>Locate on Map</Text>
            </TouchableOpacity>
          </View>
          {location && (
            <Text style={styles.locationText}>
              📍 {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </Text>
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.disabledBtn]} // Adds a disabled style
          onPress={submitReport}
          disabled={isSubmitting} // Disables the button when submitting
        >
          <Text style={styles.submitText}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'} 
          </Text>
        </TouchableOpacity>

        {/* Map Modal */}
        <Modal visible={mapVisible} animationType="slide">
          <View style={{ flex: 1 }}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: 20.5937,
                longitude: 78.9629,
                latitudeDelta: 10,
                longitudeDelta: 10,
              }}
              onPress={handleMapPress}
            >
              {location && <Marker coordinate={location} />}
            </MapView>
            <TouchableOpacity
              style={[styles.submitBtn, { margin: 20, backgroundColor: "red" }]}
              onPress={() => setMapVisible(false)}
            >
              <Text style={styles.submitText}>Close Map</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

// ------------------- STYLES -------------------
const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 25 },
  section: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between" },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
    marginHorizontal: 5,
    alignItems: "center",
    flex: 1,
  },
  btnText: { color: "#fff", textAlign: "center", fontSize: 16, fontWeight: "600" },
  imageWrapper: {
    position: "relative",
    marginTop: 10,
  },
  image: { width: "100%", height: 200, borderRadius: 10 },
  deleteBtn: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "white",
    borderRadius: 15,
  },
  pickerWrapper: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  textInput: { flex: 1, padding: 10, minHeight: 60, fontSize: 16 },
  locationBtn: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    margin: 5,
    alignItems: "center",
    flex: 1,
  },
  locationText: { marginTop: 10, fontSize: 14, fontWeight: "500", color: "#333" },
  submitBtn: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  submitText: { color: "#fff", fontSize: 18, textAlign: "center", fontWeight: "bold" },

  disabledBtn: {
    backgroundColor: '#9fdaab', // A lighter green color
  },
});
