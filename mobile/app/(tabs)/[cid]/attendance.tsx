import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db, auth } from "@/lib/firebaseConfig";
import { doc, collection, onSnapshot, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { Button } from "react-native-paper";
import AwesomeAlert from "react-native-awesome-alerts";

interface AttendanceRecord {
  date: string;
  status: string;
  score: number;
  remark: string;
}

export default function AttendanceHistoryScreen() {
  const { cid } = useLocalSearchParams();
  const router = useRouter();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [showAlert, setShowAlert] = useState(false); // ✅ ใช้สำหรับ AwesomeAlert

  useEffect(() => {
    if (user && cid) {
      fetchCourseInfo(cid as string);
      subscribeToAttendance(cid as string, user.uid);
    }
  }, [user, cid]);

  const fetchCourseInfo = async (classroomId: string) => {
    const classRef = doc(db, "classroom", classroomId);
    const classSnap = await getDoc(classRef);
    if (classSnap.exists()) {
      setCourseName(`${classSnap.data().info.code} ${classSnap.data().info.name}`);
    }
  };

  const subscribeToAttendance = (classroomId: string, userId: string) => {
    setLoading(true);

    const checkinRef = collection(db, `classroom/${classroomId}/checkin`);
    const unsubscribe = onSnapshot(checkinRef, async (snapshot) => {
      let records: AttendanceRecord[] = [];
      let total = 0;

      for (const docSnap of snapshot.docs) {
        const checkinData = docSnap.data();
        const checkinId = docSnap.id;

        const studentRef = doc(db, `classroom/${classroomId}/checkin/${checkinId}/students`, userId);
        const studentSnap = await getDoc(studentRef);

        if (studentSnap.exists()) {
          const studentData = studentSnap.data();

          records.push({
            date: checkinData.date,
            status: getStatusText(studentData.status),
            score: studentData.score ?? 0,
            remark: studentData.remark || "-",
          });
          total += studentData.score ?? 0;
        }
      }

      setAttendanceRecords(records);
      setTotalScore(total);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const getStatusText = (status: number) => {
    if (status === 1) return "มา";
    if (status === 2) return "มาสาย";
    return "ขาด";
  };

  // ✅ เปิด Alert ออกจากห้องเรียน
  const showLeaveAlert = () => {
    setShowAlert(true);
  };

  // ✅ ฟังก์ชันออกจากห้องเรียน
  const handleLeaveClassroom = async () => {
    if (!user || !cid) return;

    try {
      const studentRef = doc(db, `classroom/${cid}/students/${user.uid}`);
      await deleteDoc(studentRef); // ✅ ลบนักเรียนออกจาก /classroom/{cid}/students

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const updatedClassroom = { ...userData.classroom };
        delete updatedClassroom[cid as string];

        await updateDoc(userRef, { classroom: updatedClassroom }); // ✅ อัปเดตข้อมูลใน /users/{uid}/classroom
      }

      setShowAlert(false);
      router.replace("/"); // ✅ กลับไปหน้าหลัก
    } catch (error) {
      console.error("🚨 Error leaving classroom:", error);
      setShowAlert(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{courseName}</Text>
      </View>

      {/* คะแนนรวม */}
      <Text style={styles.totalScore}>คะแนนเช็คชื่อรวม {totalScore} คะแนน</Text>

      {/* ตารางแสดงข้อมูล */}
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <FlatList
          data={attendanceRecords}
          keyExtractor={(item, index) => index.toString()}
          ListHeaderComponent={() => (
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Date</Text>
              <Text style={styles.tableHeaderText}>Status</Text>
              <Text style={styles.tableHeaderText}>Score</Text>
              <Text style={styles.tableHeaderText}>Remark</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.date}</Text>
              <Text style={styles.tableCell}>{item.status}</Text>
              <Text style={styles.tableCell}>{item.score}</Text>
              <Text style={styles.tableCell}>{item.remark}</Text>
            </View>
          )}
        />
      )}

      {/* ปุ่มออกจากห้องเรียน & ย้อนกลับ */}
      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={showLeaveAlert} style={styles.leaveButton} color="red">
          ออกจากห้องเรียน
        </Button>
        <Button mode="outlined" onPress={() => router.back()} style={styles.backButton}>
          กลับไปหน้าหลัก
        </Button>
      </View>

      {/* ✅ AwesomeAlert สำหรับยืนยันการออกจากห้องเรียน */}
      <AwesomeAlert
        show={showAlert}
        showProgress={false}
        title="ออกจากห้องเรียน"
        message="คุณแน่ใจหรือไม่ว่าต้องการออกจากห้องเรียนนี้?"
        closeOnTouchOutside={false}
        closeOnHardwareBackPress={false}
        showCancelButton={true}
        showConfirmButton={true}
        cancelText="ยกเลิก"
        confirmText="ออกจากห้องเรียน"
        confirmButtonColor="red"
        onCancelPressed={() => setShowAlert(false)}
        onConfirmPressed={handleLeaveClassroom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5", padding: 10 },
  header: { backgroundColor: "#4CAF50", padding: 15, alignItems: "center" },
  headerText: { fontSize: 18, fontWeight: "bold", color: "white" },
  totalScore: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginVertical: 10 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E0E0E0",
    padding: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderText: { flex: 1, fontWeight: "bold", textAlign: "center" },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#FFF",
  },
  tableCell: { flex: 1, textAlign: "center" },
  buttonContainer: { marginTop: 20, alignItems: "center" },
  leaveButton: { marginBottom: 10, width: "80%" },
  backButton: { width: "80%" },
});