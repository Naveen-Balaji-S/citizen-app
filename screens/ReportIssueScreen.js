import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

export default function ReportIssueForm() {
  const [image, setImage] = useState(null);
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState(null);

  // Ask permissions on mount
  useEffect(() => {
    (async () => {
      const { status: imageStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (imageStatus !== "granted") {
        Alert.alert("Permission required", "Camera roll access is needed.");
      }

      const { status: locationStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== "granted") {
        Alert.alert("Permission required", "Location access is needed.");
      }
    })();
  }, []);

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

  // Get location
  const fetchLocation = async () => {
    let currentLocation = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    });
  };

  // Submit form
  const submitReport = () => {
    if (!image || !department || !location) {
      Alert.alert("Missing Info", "Please complete all fields.");
      return;
    }

    const reportData = {
      image,
      department,
      location,
      timestamp: new Date().toISOString(),
    };

    console.log("Report submitted:", reportData);
    Alert.alert("✅ Success", "Your issue has been reported!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📢 Report a Civic Issue</Text>

      {/* Upload Photo Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Upload a Photo:</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.btnText}>Choose from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text style={styles.btnText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
        {image && <Image source={{ uri: image }} style={styles.image} />}
      </View>

      {/* Department Selection */}
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

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Location:</Text>
        <TouchableOpacity style={styles.button} onPress={fetchLocation}>
          <Text style={styles.btnText}>Get Current Location</Text>
        </TouchableOpacity>
        {location && (
          <Text style={styles.locationText}>
            📍 {location.latitude}, {location.longitude}
          </Text>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitBtn} onPress={submitReport}>
        <Text style={styles.submitText}>Submit Report</Text>
      </TouchableOpacity>
    </View>
  );
}

// ------------------- STYLES -------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: 200,
    marginTop: 10,
    borderRadius: 10,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  locationText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  submitBtn: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  submitText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
});
