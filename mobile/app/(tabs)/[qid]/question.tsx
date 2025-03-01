import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView,
  Platform, Image
} from "react-native";
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
  const [studentProfiles, setStudentProfiles] = useState<Record<string, string>>({});
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [isGuestMode, setIsGuestMode] = useState(true);

  useEffect(() => {
    if (user && qid) {
      loadUserInfo(user.uid);
      findQuestionPath(qid as string);
    }
  }, [user, qid]);

  useEffect(() => {
    if (cid) {
      fetchStudentProfiles();
    }
  }, [cid]);

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

  const fetchStudentProfiles = async () => {
    try {
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);

      let profiles: Record<string, string> = {};

      usersSnapshot.forEach((docSnap) => {
        const userData = docSnap.data();
        const stdid = userData.stdid;
        let photo = userData.photo;

        if (stdid) {
          if (photo && !photo.startsWith("http")) {
            photo = `data:image/jpeg;base64,${photo}`;
          }

          profiles[stdid] = photo || getRandomProfile(stdid);
        }
      });

      setStudentProfiles(profiles);
    } catch (error) {
      console.error("Error fetching student profiles:", error);
    }
  };

  const getRandomName = (stdid: string): string => {
    if (!nameMap[stdid]) {
      const randomNames = [
        "Apple", "Banana", "Cherry", "Durian", "Elderberry", "Fig", "Grape",
        "Honeydew", "Jackfruit", "Kiwi", "Lemon", "Mango", "Orange", "Peach"
      ];
      nameMap[stdid] = randomNames[Math.floor(Math.random() * randomNames.length)];
    }
    return nameMap[stdid];
  };

  const getRandomProfile = (stdid: string): any => {
    if (!profileMap[stdid]) {
      const randomProfile = Math.floor(Math.random() * 12) + 1;

      // ✅ ใช้ require() แบบคงที่แทน string
      const emojiMap: { [key: number]: any } = {
        1: require("@/assets/emoji/1.svg"),
        2: require("@/assets/emoji/2.svg"),
        3: require("@/assets/emoji/3.svg"),
        4: require("@/assets/emoji/4.svg"),
        5: require("@/assets/emoji/5.svg"),
        6: require("@/assets/emoji/6.svg"),
        7: require("@/assets/emoji/7.svg"),
        8: require("@/assets/emoji/8.svg"),
        9: require("@/assets/emoji/9.svg"),
        10: require("@/assets/emoji/10.svg"),
        11: require("@/assets/emoji/11.svg"),
        12: require("@/assets/emoji/12.svg"),
      };

      profileMap[stdid] = emojiMap[randomProfile];
    }
    return profileMap[stdid];
  };

  const getProfilePicture = (stdid: string): any => {
    if (isGuestMode) {
      return getRandomProfile(stdid); // ✅ ถ้าเป็น Guest Mode ให้ใช้ emoji
    }
  
    const profileUrl = studentProfiles[stdid];
    if (profileUrl) {
      return profileUrl.startsWith("http") ? { uri: profileUrl } : require("@/assets/default-profile.png");
    }
  
    return getRandomProfile(stdid); // ✅ ถ้าไม่มีรูป ใช้ emoji แทน
  };

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

  const sendMessage = async () => {
    if (!user || !message.trim() || !cid || !cno || !qid || !stdid) return;

    try {
      const chatRef = collection(db, `classroom/${cid}/checkin/${cno}/question/${qid}/answers`);
      await addDoc(chatRef, {
        text: message.trim(),
        user: user.displayName || "ไม่ทราบชื่อ",
        stdid: stdid,
        time: new Date().toISOString(),
      });

      setMessage("");
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
              <Image
                source={typeof getProfilePicture(item.stdid) === "string"
                  ? { uri: getProfilePicture(item.stdid) }
                  : getProfilePicture(item.stdid)}
                style={styles.profileImage}
              />
              <View style={styles.messageContent}>
                <Text style={styles.username}>
                  {isGuestMode ? getRandomName(item.stdid) : item.user}
                </Text>
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            </View>
          )}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput style={styles.input} value={message} onChangeText={setMessage} placeholder="กรอกคำตอบของคุณ..." />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>ส่ง</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 10,
  },
  header: {
    backgroundColor: "#4CAF50",
    padding: 15,
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF",
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  messageContent: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    padding: 10,
    borderRadius: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E88E5",
    marginBottom: 3,
  },
  messageText: {
    fontSize: 14,
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#CCC",
    backgroundColor: "#FFF",
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  sendButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});