import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { TextInput, Button, Avatar, ActivityIndicator, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [name, setName] = useState('');
  const [stdid, setStdid] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setName(userData.name || '');
          setStdid(userData.stdid || '');
          setEmail(userData.email || '');
          setPhoto(userData.photo || null);
        }
      }
    };

    fetchProfile();
  }, []);

  const showAlert = (message: string, success: boolean = false) => {
    setAlertMessage(message);
    setAlertSuccess(success);
    setAlertVisible(true);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const resizedImage = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      setPhoto(resizedImage.uri);
      setImageBase64(resizedImage.base64 || null);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !stdid.trim()) {
      showAlert('❌ กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (!user) {
      showAlert('❌ ผู้ใช้ไม่พบ');
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);

      await updateDoc(userRef, {
        name: name.trim(),
        stdid: stdid.trim(),
        photo: imageBase64 || photo,
      });

      setLoading(false);
      showAlert('✅ บันทึกข้อมูลสำเร็จ', true);
    } catch (error) {
      setLoading(false);
      showAlert('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* หัวข้อ Profile */}
        <View style={styles.header}>
          <Text style={styles.title}>แก้ไขโปรไฟล์</Text>
        </View>

        {/* อวาตาร์ */}
        <Pressable onPress={pickImage} style={styles.avatarContainer}>
          <Avatar.Image size={100} source={photo ? { uri: photo } : require('@/assets/default-profile.png')} />
        </Pressable>

        {/* ฟอร์มกรอกข้อมูล */}
        <TextInput label="ชื่อ" value={name} onChangeText={setName} style={styles.input} mode="outlined" />
        <TextInput label="รหัสนักเรียน" value={stdid} onChangeText={setStdid} style={styles.input} mode="outlined" />
        <TextInput label="อีเมล" value={email} style={styles.input} mode="outlined" disabled /> {/* อีเมลแก้ไขไม่ได้ */}

        {/* ปุ่มบันทึกข้อมูล */}
        {loading ? (
          <ActivityIndicator animating={true} color="blue" />
        ) : (
          <Button mode="contained" onPress={handleSave} style={styles.button}>
            บันทึกข้อมูล
          </Button>
        )}

        {/* ปุ่มกลับหน้าแรก */}
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.link}>กลับไปหน้าหลัก</Text>
        </TouchableOpacity>

        {/* SweetAlert แสดงผลแจ้งเตือน */}
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
          onConfirmPressed={() => setAlertVisible(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 20 }, 
  title: { fontSize: 24, fontWeight: 'bold' },
  avatarContainer: { marginBottom: 20 },
  input: { width: '100%', marginBottom: 10 },
  button: { marginTop: 10, width: '100%' },
  link: { marginTop: 15, color: '#007bff', fontSize: 16 },
});