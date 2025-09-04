// components/FormButton.tsx
import React from 'react';
import { Button } from 'react-native-paper';
import { StyleSheet } from 'react-native';

type FormButtonProps = React.ComponentProps<typeof Button>;

export default function FormButton(props: FormButtonProps) {
  return (
    <Button
      mode="contained"
      {...props}
      style={[styles.button, props.style]}
      labelStyle={styles.label}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    marginVertical: 10,
  },
  label: {
    fontWeight: 'bold',
  },
});