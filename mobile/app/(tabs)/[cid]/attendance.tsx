import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db, auth } from "@/lib/firebaseConfig";
import { doc, collection, onSnapshot, getDoc } from "firebase/firestore";
import { Button } from "react-native-paper";

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

  useEffect(() => {
    if (user && cid) {
      fetchCourseInfo(cid as string);
      subscribeToAttendance(cid as string, user.uid);
    }
  }, [user, cid]);

  // ✅ โหลดข้อมูลชื่อวิชา
  const fetchCourseInfo = async (classroomId: string) => {
    const classRef = doc(db, "classroom", classroomId);
    const classSnap = await getDoc(classRef);
    if (classSnap.exists()) {
      setCourseName(`${classSnap.data().info.code} ${classSnap.data().info.name}`);
    }
  };

  // ✅ Subscribe ดึงข้อมูลเช็คชื่อแบบเรียลไทม์
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

      {/* ปุ่มย้อนกลับ */}
      <Button mode="outlined" onPress={() => router.back()} style={styles.backButton}>
        กลับไปหน้าหลัก
      </Button>
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
  backButton: { marginTop: 20, alignSelf: "center" },
});