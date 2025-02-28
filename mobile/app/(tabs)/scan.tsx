import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

export default function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  // ใช้ useFocusEffect เพื่อล้างค่า scanned ทุกครั้งที่หน้าจอกลับมาเป็น active
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
    }, [])
  );

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    router.push({
      pathname: '/',
      params: { scannedData: `${type}: ${data}` },
    });
  };

  if (!permission) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text>No access to camera</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      {scanned && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  camera: { flex: 1, width: '100%' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultContainer: { position: 'absolute', bottom: 20, backgroundColor: 'white', padding: 10 },
  resultText: { fontSize: 16, fontWeight: 'bold' },
});