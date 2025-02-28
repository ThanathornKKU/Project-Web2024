import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import AwesomeAlert from "react-native-awesome-alerts";

export default function CheckinScreen() {
  const { cno } = useLocalSearchParams();
  const router = useRouter();
  const user = auth.currentUser;

  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [expectedCode, setExpectedCode] = useState<string | null>(null);
  const [enteredCode, setEnteredCode] = useState("");
  const [remark, setRemark] = useState("");
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSuccess, setAlertSuccess] = useState(false);

  useEffect(() => {
    if (user && cno) {
      loadUserData(user.uid);
      findClassroomAndListenToCheckin(cno as string, user.uid);
    }
  }, [user, cno]);

  const loadUserData = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setStudentName(userData.name || "ไม่ทราบชื่อ");
        setStudentId(userData.stdid || "ไม่ทราบรหัส");
      } else {
        throw new Error("❌ ไม่พบข้อมูลนักเรียน");
      }
    } catch (error) {
      console.error("🔥 โหลดข้อมูลนักเรียนล้มเหลว:", error);
    }
  };

  const findClassroomAndListenToCheckin = async (checkinNo: string, userId: string) => {
    setLoading(true);
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("❌ ไม่พบข้อมูลนักเรียน");

      const userData = userSnap.data();
      const classrooms = userData.classroom || {};
      let foundCid = null;

      for (const cid of Object.keys(classrooms)) {
        const checkinRef = doc(db, `classroom/${cid}/checkin/${checkinNo}`);
        const checkinSnap = await getDoc(checkinRef);
        if (checkinSnap.exists()) {
          foundCid = cid;
          setClassroomId(cid);

          const classRef = doc(db, `classroom/${cid}`);
          const classSnap = await getDoc(classRef);
          const classData = classSnap.data()?.info;

          if (!classData) throw new Error("❌ ไม่พบข้อมูลคะแนนวิชานี้");

          const normalScore = classData.score ?? 0;
          const lateScore = classData.score_late ?? 0;

          onSnapshot(checkinRef, (snapshot) => {
            if (snapshot.exists()) {
              const checkinData = snapshot.data();
              setExpectedCode(checkinData.code || "");
              setStatus(checkinData.status ?? 0);
              setScore(checkinData.status === 1 ? normalScore : lateScore);
            }
          });

          break;
        }
      }

      if (!foundCid) {
        throw new Error("❌ ไม่พบข้อมูลเช็คชื่อ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (error) {
      setAlertMessage(error instanceof Error ? error.message : "❌ เกิดข้อผิดพลาด");
      setAlertSuccess(false);
      setAlertVisible(true);
    }
    setLoading(false);
  };

  const handleSubmitCode = () => {
    if (status === 0) {
      setAlertMessage("❌ เช็คชื่อยังไม่เปิด กรุณารอให้ระบบเปิดเช็คชื่อก่อน");
      setAlertSuccess(false);
      setAlertVisible(true);
      return;
    }

    if (enteredCode.trim() === expectedCode) {
      setStep(2);
    } else {
      setAlertMessage("❌ รหัสเช็คชื่อไม่ถูกต้อง กรุณาลองใหม่");
      setAlertSuccess(false);
      setAlertVisible(true);
    }
  };

  const handleConfirmCheckin = async () => {
    if (!user || !classroomId) return;
    setLoading(true);

    try {
      const studentRef = doc(db, `classroom/${classroomId}/checkin/${cno}/students`, user.uid);

      if (!studentName || !studentId) {
        throw new Error("❌ ไม่พบข้อมูลนักเรียน กรุณาลองใหม่");
      }

      if (score === undefined || score === null) {
        throw new Error("❌ ข้อมูลคะแนน (score) ไม่ถูกต้อง กรุณาลองใหม่");
      }

      await setDoc(studentRef, {
        uid: user.uid,
        stdid: studentId,
        name: studentName,
        score: score ?? 0,
        remark: remark || "-",
        date: new Date().toLocaleString(),
        status: status ?? 0,
      });

      setAlertMessage("✅ เช็คชื่อสำเร็จ! คุณได้ทำการเช็คชื่อเรียบร้อยแล้ว");
      setAlertSuccess(true);
      setAlertVisible(true);
    } catch (error) {
      setAlertMessage(error instanceof Error ? error.message : "❌ เกิดข้อผิดพลาด ไม่สามารถเช็คชื่อได้ กรุณาลองใหม่");
      setAlertSuccess(false);
      setAlertVisible(true);
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>เช็คชื่อ</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : status === 0 ? (
        <Text style={styles.errorText}>⛔ เช็คชื่อยังไม่เปิด กรุณารอ</Text>
      ) : step === 1 ? (
        <View style={styles.stepContainer}>
          <Text style={styles.label}>กรอกรหัสเช็คชื่อ</Text>
          <TextInput
            style={styles.input}
            value={enteredCode}
            onChangeText={setEnteredCode}
            placeholder="รหัสเช็คชื่อ"
          />
          <Button title="ถัดไป" onPress={handleSubmitCode} />
        </View>
      ) : (
        <View style={styles.stepContainer}>
          <Text style={styles.label}>กรอกหมายเหตุ (ถ้ามี)</Text>
          <TextInput
            style={styles.input}
            value={remark}
            onChangeText={setRemark}
            placeholder="หมายเหตุ"
          />
          <Button title="ยืนยัน" onPress={handleConfirmCheckin} />
        </View>
      )}

      {/* Popup แจ้งเตือน */}
      <AwesomeAlert
        show={alertVisible}
        showProgress={false}
        title={alertSuccess ? "✅ สำเร็จ" : "❌ ข้อผิดพลาด"}
        message={alertMessage}
        closeOnTouchOutside={false}
        closeOnHardwareBackPress={false}
        showCancelButton={false}
        showConfirmButton={true}
        confirmText="ตกลง"
        confirmButtonColor={alertSuccess ? "#28a745" : "#dc3545"}
        onConfirmPressed={() => {
          setAlertVisible(false);
          if (alertSuccess) {
            router.replace("/"); // ✅ Redirect ไปที่หน้า index หลังจากเช็คชื่อสำเร็จ
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#F5F5F5" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#4CAF50" },
  errorText: { fontSize: 18, fontWeight: "bold", color: "red", marginTop: 20 },
  stepContainer: { width: "100%", alignItems: "center" },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  input: { width: "100%", padding: 10, borderWidth: 1, borderRadius: 8, marginBottom: 10, backgroundColor: "#FFF" },
});