// screens/ReportFormScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import FormButton from '../components/FormButton';
import FormSelect from '../components/FormSelect';
import { RootStackParamList } from '../navigation/AppNavigator'; // For type safety

// Define the type for the navigation prop for type safety
type ReportFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReportForm'>;

export default function ReportFormScreen() {
  const navigation = useNavigation<ReportFormScreenNavigationProp>();

  // --- STATE VARIABLES ---
  const [photo, setPhoto] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('pothole'); // Default value
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isFormReady, setIsFormReady] = useState(false);

  // --- STEP 3: PLACEHOLDER HANDLER FUNCTIONS ---
  const handleTakePhoto = () => {
    console.log('Simulating taking a photo...');
    setPhoto('dummy_photo_uri.jpg'); // Set a fake photo URI to update state
  };

  const handleGetLocation = () => {
    console.log('Simulating fetching location...');
    setLocation({ lat: 13.0827, lng: 80.2707 }); // Set fake coordinates
  };

  const handleSubmit = () => {
    const reportPayload = {
      photoUri: photo,
      category: category,
      location: location,
      timestamp: new Date().toISOString(),
    };
    console.log('Submitting Report:', reportPayload);
    navigation.navigate('Success'); // Navigate to the Success screen
  };

  // --- STEP 4: FORM VALIDATION LOGIC ---
  useEffect(() => {
    // The form is ready only if photo, category, and location have values.
    if (photo && category && location) {
      setIsFormReady(true);
    } else {
      setIsFormReady(false);
    }
  }, [photo, category, location]); // This effect re-runs if any of these values change

  // --- Data for the dropdown ---
  const reportCategories = [
    { label: 'Pothole', value: 'pothole' },
    { label: 'Broken Streetlight', value: 'streetlight' },
    { label: 'Fallen Tree', value: 'tree' },
    { label: 'Graffiti', value: 'graffiti' },
  ];

  // --- STEP 5: UI INTEGRATION ---
  return (
    <View style={styles.container}>
      {/* Photo Button: Connected to the photo handler and state */}
      <FormButton icon="camera" onPress={handleTakePhoto}>
        {photo ? 'Photo Taken ✅' : 'Take Photo'}
      </FormButton>

      {/* Category Select: Connected to the category state */}
      <FormSelect
        label="Report Category"
        options={reportCategories}
        selectedValue={category}
        onValueChange={(itemValue) => setCategory(itemValue)}
      />

      {/* Location Button: Connected to the location handler and state */}
      <FormButton icon="map-marker" mode="outlined" onPress={handleGetLocation}>
        {location ? 'Location Captured ✅' : 'Get Location'}
      </FormButton>

      {/* Submit Button: Connected to the submit handler and validation state */}
      <FormButton
        mode="contained"
        onPress={handleSubmit}
        disabled={!isFormReady} // Button is disabled if form is NOT ready
      >
        Submit Report
      </FormButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
});