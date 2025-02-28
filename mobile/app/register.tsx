import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Avatar, ActivityIndicator, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [stdid, setStdId] = useState(''); // ✅ เพิ่มช่องรหัสนักเรียน
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);

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

      setImage(resizedImage.uri);
      setImageBase64(resizedImage.base64 || null);
    }
  };

  const handleRegister = async () => {
    console.log("📌 เริ่มต้นการสมัครสมาชิก...");
    console.log("📌 Email:", email);
    console.log("📌 Password:", password);
    console.log("📌 stdid:", stdid);

    if (!name.trim() || !stdid.trim() || !email.trim() || !password || !confirmPassword) {
      showAlert('❌ กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('❌ รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (password.length < 6) {
      showAlert('❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert('❌ กรุณากรอกอีเมลให้ถูกต้อง เช่น example@gmail.com');
      return;
    }

    try {
      setLoading(true);
      console.log("🔵 ส่งคำขอไปยัง Firebase...");

      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;

      console.log("✅ สมัครสมาชิกสำเร็จ! UID:", uid);

      await setDoc(doc(db, 'users', uid), {
        name: name.trim(),
        stdid: stdid.trim(),  // ✅ เพิ่มรหัสนักเรียน
        email: email.trim(),
        photo: imageBase64 || null,
        classroom: {},
      });

      setLoading(false);
      showAlert('✅ สมัครสมาชิกสำเร็จ', true);
    } catch (error: any) {
      setLoading(false);
      console.log("🚨 Firebase Error:", JSON.stringify(error));

      let errorMessage = "เกิดข้อผิดพลาดในการสมัครสมาชิก";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "❌ อีเมลนี้ถูกใช้งานแล้ว";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "❌ รูปแบบอีเมลไม่ถูกต้อง";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
      } else {
        errorMessage = `❌ ข้อผิดพลาด: ${error.message}`;
      }

      showAlert(errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          <Avatar.Image size={100} source={image ? { uri: image } : require('@/assets/default-profile.png')} />
        </TouchableOpacity>

        <TextInput label="ชื่อ" value={name} onChangeText={setName} style={styles.input} mode="outlined" />
        <TextInput label="รหัสนักเรียน" value={stdid} onChangeText={setStdId} style={styles.input} mode="outlined" keyboardType="numeric" />
        <TextInput label="อีเมล" value={email} onChangeText={setEmail} style={styles.input} mode="outlined" keyboardType="email-address" />
        <TextInput label="รหัสผ่าน" value={password} onChangeText={setPassword} style={styles.input} mode="outlined" secureTextEntry />
        <TextInput label="ยืนยันรหัสผ่าน" value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} mode="outlined" secureTextEntry />

        {loading ? (
          <ActivityIndicator animating={true} color="blue" />
        ) : (
          <Button mode="contained" onPress={handleRegister} style={styles.button}>
            สมัครสมาชิก
          </Button>
        )}

        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={styles.link}>มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</Text>
        </TouchableOpacity>

        {/* SweetAlert */}
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
              router.replace('/login');
            }
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  avatarContainer: { marginBottom: 20 },
  input: { width: '100%', marginBottom: 10 },
  button: { marginTop: 10, width: '100%' },
  link: { marginTop: 15, color: '#007bff', fontSize: 16 },
});