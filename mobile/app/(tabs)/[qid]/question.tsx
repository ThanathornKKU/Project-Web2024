import React, { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, collection, addDoc, onSnapshot, orderBy, query, getDoc, getDocs } from "firebase/firestore";

interface ChatMessage {
  id: string;
  text: string;
  user: string;
  stdid: string;
  timestamp: string;
}

export default function QuestionScreen() {
  const { qid } = useLocalSearchParams();
  const router = useRouter();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [cid, setCid] = useState<string | null>(null);
  const [cno, setCno] = useState<string | null>(null);
  const [stdid, setStdid] = useState<string | null>(null);

  useEffect(() => {
    if (user && qid) {
      loadUserInfo(user.uid);
      findQuestionPath(qid as string);
    }
  }, [user, qid]);

  // ✅ โหลดข้อมูล `stdid` ของผู้ใช้
  const loadUserInfo = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setStdid(userSnap.data().stdid || "ไม่ทราบรหัส");
      }
    } catch (error) {
      console.error("🔥 โหลดข้อมูลนักเรียนล้มเหลว:", error);
    }
  };

  // ✅ หา `cid` และ `cno` จาก `qid`
  const findQuestionPath = async (questionId: string) => {
    try {
      const classroomsRef = collection(db, "classroom");
      const classroomsSnap = await getDocs(classroomsRef);

      for (const classDoc of classroomsSnap.docs) {
        const checkinRef = collection(db, `classroom/${classDoc.id}/checkin`);
        const checkinSnap = await getDocs(checkinRef);

        for (const checkinDoc of checkinSnap.docs) {
          const questionRef = doc(db, `classroom/${classDoc.id}/checkin/${checkinDoc.id}/question/${questionId}`);
          const questionSnap = await getDoc(questionRef);

          if (questionSnap.exists()) {
            setCid(classDoc.id);
            setCno(checkinDoc.id);
            subscribeToChat(classDoc.id, checkinDoc.id, questionId);
            return;
          }
        }
      }
    } catch (error) {
      console.error("🔥 Error finding question path:", error);
    }
  };

  // ✅ Subscribe ดึงข้อความแชทแบบ `real-time`
  const subscribeToChat = (classroomId: string, checkinNo: string, questionId: string) => {
    setLoading(true);
    const chatRef = collection(db, `classroom/${classroomId}/checkin/${checkinNo}/question/${questionId}/answers`);
    const q = query(chatRef, orderBy("time", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          text: doc.data().text,
          user: doc.data().user,
          stdid: doc.data().stdid || "ไม่ทราบรหัส",
          timestamp: doc.data().time,
        });
      });

      setChatMessages(messages);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  // ✅ ส่งข้อความเข้า Firestore
  const sendMessage = async () => {
    if (!user || !message.trim() || !cid || !cno || !qid || !stdid) return;

    try {
      const chatRef = collection(db, `classroom/${cid}/checkin/${cno}/question/${qid}/answers`);
      await addDoc(chatRef, {
        text: message.trim(),
        user: user.displayName || "ไม่ทราบชื่อ",
        stdid: stdid,
        time: new Date().toISOString(), // ✅ เวลาเป็น `ISO 8601`
      });

      setMessage(""); // ✅ เคลียร์ช่องป้อนข้อความหลังส่ง
    } catch (error) {
      console.error("🔥 Error sending message:", error);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>คำถามที่เปิดอยู่</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <FlatList
          data={chatMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>
                {item.timestamp} {item.stdid} {item.user}: {item.text}
              </Text>
            </View>
          )}
        />
      )}

      {/* ช่องป้อนข้อความ */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="กรอกคำตอบของคุณ..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>ส่ง</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5", padding: 10 },
  header: { backgroundColor: "#4CAF50", padding: 15, alignItems: "center" },
  headerText: { fontSize: 18, fontWeight: "bold", color: "white" },
  messageContainer: {
    padding: 10,
    backgroundColor: "#FFF",
    borderRadius: 8,
    marginVertical: 5,
  },
  messageText: { fontSize: 14 },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
  },
  input: { flex: 1, padding: 10, borderWidth: 1, borderRadius: 8 },
  sendButton: { marginLeft: 10, backgroundColor: "#4CAF50", padding: 10, borderRadius: 8 },
  sendButtonText: { color: "white", fontWeight: "bold" },
});