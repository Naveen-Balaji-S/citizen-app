// screens/ReportFormScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FormButton from '../components/FormButton';
import FormSelect from '../components/FormSelect';

export default function ReportFormScreen() {
  // Temporary state for visual testing. Dev C will manage the real state.
  const [tempCategory, setTempCategory] = useState('pothole');
  const reportCategories = [
    { label: 'Pothole', value: 'pothole' },
    { label: 'Broken Streetlight', value: 'streetlight' },
    { label: 'Fallen Tree', value: 'tree' },
    { label: 'Graffiti', value: 'graffiti' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create a New Report</Text>

      {/* This button is a placeholder for the camera functionality */}
      <FormButton icon="camera" onPress={() => console.log('Take Photo Pressed')}>
        Take Photo
      </FormButton>

      <FormSelect
        label="Report Category"
        options={reportCategories}
        selectedValue={tempCategory}
        onValueChange={setTempCategory}
      />

      {/* Placeholder for the location component */}
      <FormButton icon="map-marker" mode="outlined" onPress={() => console.log('Get Location Pressed')}>
        Get Location
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