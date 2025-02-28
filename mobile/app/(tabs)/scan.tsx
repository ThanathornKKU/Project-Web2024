import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  const [courseInfo, setCourseInfo] = useState<{ code: string; name: string } | null>(null);
  const [cid, setCid] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);
  const user = auth.currentUser;

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

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);

    if (data.startsWith("cid")) {
      const extractedCid = data.replace("cid", "").trim();
      setCid(extractedCid);

      try {
        const classRef = doc(db, "classroom", extractedCid);
        const classSnap = await getDoc(classRef);

        if (classSnap.exists()) {
          const classData = classSnap.data();
          setCourseInfo({ code: classData.info.code, name: classData.info.name });
          setConfirmVisible(true); // แสดง Popup ยืนยันเข้าร่วม
        } else {
          setAlertMessage("❌ ไม่พบวิชานี้\nกรุณาลองใหม่อีกครั้ง");
          setAlertSuccess(false);
          setAlertVisible(true);
          setScanned(false);
        }
      } catch (error) {
        setAlertMessage("❌ ข้อผิดพลาด\nเกิดข้อผิดพลาดในการโหลดข้อมูลวิชา");
        setAlertSuccess(false);
        setAlertVisible(true);
        setScanned(false);
      }
    } else {
      router.push({
        pathname: "/",
        params: { scannedData: `${type}: ${data}` },
      });
    }
  };

  const handleJoinClass = async () => {
    if (!user || !cid) return;
    setConfirmVisible(false);

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        [`classroom.${cid}`]: { status: 2 },
      });

      setAlertMessage("✅ ลงทะเบียนสำเร็จ!\nคุณเข้าร่วมวิชานี้เรียบร้อยแล้ว");
      setAlertSuccess(true);
      setAlertVisible(true);
    } catch (error) {
      setAlertMessage("❌ เกิดข้อผิดพลาด\nไม่สามารถลงทะเบียนได้ กรุณาลองใหม่");
      setAlertSuccess(false);
      setAlertVisible(true);
    }
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
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {scanned && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Processing...</Text>
        </View>
      )}

      {/* Popup ยืนยันการเข้าร่วมวิชา */}
      <AwesomeAlert
        show={confirmVisible}
        showProgress={false}
        title="📚 เข้าร่วมวิชา"
        message={`จะเข้าร่วม\n${courseInfo?.code} - ${courseInfo?.name} หรือไม่?`}
        closeOnTouchOutside={false}
        closeOnHardwareBackPress={false}
        showCancelButton={true}
        showConfirmButton={true}
        cancelText="ยกเลิก"
        confirmText="เข้าร่วม"
        confirmButtonColor="#28a745"
        cancelButtonColor="#dc3545"
        onCancelPressed={() => setConfirmVisible(false)}
        onConfirmPressed={handleJoinClass}
      />

      {/* Popup แจ้งเตือนหลังลงทะเบียน */}
      <AwesomeAlert
        show={alertVisible}
        showProgress={false}
        title={alertSuccess ? "✅ สำเร็จ" : "❌ ข้อผิดพลาด"}
        message={alertMessage}
        closeOnTouchOutside={true}
        closeOnHardwareBackPress={false}
        showCancelButton={false}
        showConfirmButton={true}
        confirmText="ตกลง"
        confirmButtonColor={alertSuccess ? "#28a745" : "#dc3545"}
        onConfirmPressed={() => {
          setAlertVisible(false);
          if (alertSuccess) {
            router.replace("/");
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  camera: { flex: 1, width: "100%" },
  permissionContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  resultContainer: { position: "absolute", bottom: 20, backgroundColor: "white", padding: 10 },
  resultText: { fontSize: 16, fontWeight: "bold" },
});