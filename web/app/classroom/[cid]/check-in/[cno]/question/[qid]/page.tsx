"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection as firestoreCollection, DocumentSnapshot, DocumentData, CollectionReference, getDocs as firestoreGetDocs } from "firebase/firestore";
import Link from "next/link";

interface Answer {
  stdid: string; 
  text: string;
  time: string;
}

interface Question {
  id: string;
  question_no: number;
  question_text: string;
  question_show: boolean;
  answers?: Record<string, Answer>;
}

export default function CheckinQuestions() {
  const { cid, cno, qid } = useParams<{ cid: string; cno: string; qid: string }>(); 
  const [question, setQuestion] = useState<Question | null>(null);
  const [checkinDate, setCheckinDate] = useState<string>("");
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(true); // ✅ ค่าเริ่มต้นเป็น Guest Mode
  const [nameMap, setNameMap] = useState<Record<string, string>>({}); // ✅ เก็บชื่อสุ่มของแต่ละคน
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [studentProfiles, setStudentProfiles] = useState<Record<string, string>>({}); // ✅ เพิ่ม studentProfiles

  useEffect(() => {
    if (cid && cno && qid) {
      fetchCheckinData(cid, cno);
      fetchQuestion(cid, cno, qid);
      fetchAnswers(cid, cno, qid);
    }
  }, [cid, cno, qid]);  

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight; // ✅ เลื่อนลงไปที่ข้อความล่าสุด
    }
  }, [question?.answers]);
  
  useEffect(() => {
    if (cid) {
      fetchStudentProfiles(cid);
    }
  }, [cid]);

  const fetchCheckinData = (classroomId: string, checkinNo: string) => {
    const checkinRef = doc(db, `classroom/${classroomId}/checkin`, checkinNo);
    onSnapshot(checkinRef, (snapshot) => {
      if (snapshot.exists()) {
        setCheckinDate(snapshot.data().date);
      }
    });
  };

  const fetchQuestion = (classroomId: string, checkinNo: string, questionId: string) => {
    const questionRef = doc(db, `classroom/${classroomId}/checkin/${checkinNo}/question`, questionId);
    onSnapshot(questionRef, (snapshot) => {
      if (snapshot.exists()) {
        setQuestion({ id: snapshot.id, ...snapshot.data() } as Question);
      }
    });
  };

  const fetchAnswers = (classroomId: string, checkinNo: string, questionId: string) => {
    const answersRef = firestoreCollection(db, `classroom/${classroomId}/checkin/${checkinNo}/question/${questionId}/answers`);
    
    onSnapshot(answersRef, (answersSnapshot) => {
      const allAnswers: Record<string, Answer> = {};
  
      answersSnapshot.forEach((docSnap) => {
        const answerData = docSnap.data();
        const qno = docSnap.id; // ใช้ `qno` เป็น key
  
        if (answerData.stdid) {
          allAnswers[qno] = {
            stdid: answerData.stdid,
            text: answerData.text,
            time: answerData.time,
          };
        }
      });
  
      setQuestion((prev) => (prev ? { ...prev, answers: allAnswers } : null));
    });
  };  

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toISOString().replace("T", " ").split(".")[0]; // 2025-02-28 14:30:00
  };  

  // ✅ ฟังก์ชันสุ่มชื่อ (ใช้ชื่อเดิมของนักศึกษาเดิม)
  const getRandomName = (stdid: string, nameMap: Record<string, string>): string => {
    if (!nameMap[stdid]) {
      const randomNames = [
        "Apple", "Banana", "Cherry", "Durian", "Elderberry", "Fig", "Grape", "Honeydew", "Jackfruit", "Kiwi",
        "Lemon", "Mango", "Nectarine", "Orange", "Papaya", "Peach", "Pear", "Pineapple", "Plum", "Pomegranate",
        "Raspberry", "Strawberry", "Tangerine", "Watermelon", "Coconut", "Cantaloupe", "Blueberry", "Blackberry", "Cranberry", "Guava",
        "Apricot", "Avocado", "Dragonfruit", "Passionfruit", "Lychee", "Mulberry", "Gooseberry", "Persimmon", "Starfruit", "Mandarin",
        "Clementine", "Boysenberry", "Currant", "Kumquat", "Olive", "Soursop", "Date", "Tamarind", "Fig", "Pomelo"
      ];      
      nameMap[stdid] = randomNames[Math.floor(Math.random() * randomNames.length)];
    }
    return nameMap[stdid];
  };

  const getRandomProfile = (stdid: string, profileMap: Record<string, string>): string => {
    if (!profileMap[stdid]) {
      const randomProfile = Math.floor(Math.random() * 12) + 1; // เลข 1-12
      profileMap[stdid] = `/emoji/${randomProfile}.svg`; // รูปจาก public/emoji/
    }
    return profileMap[stdid];
  };  
  
  const fetchStudentProfiles = async (classroomId: string) => { // ✅ รับ `cid` เป็นพารามิเตอร์
    try {
      // ✅ ดึงข้อมูล users ทั้งหมดจาก Firestore
      const usersRef = firestoreCollection(db, "users");
      const usersSnapshot = await firestoreGetDocs(usersRef);
  
      // ✅ Map stdid -> photo
      const profiles: Record<string, string> = {};
  
      usersSnapshot.forEach((docSnap) => {
        const userData = docSnap.data();
        const stdid = userData.stdid;
        let photo = userData.photo;
  
        if (stdid) {
          // ✅ ตรวจสอบว่าเป็น Base64 หรือ URL
          if (photo && !photo.startsWith("http")) {
            photo = `data:image/jpeg;base64,${photo}`;
          }
  
          profiles[stdid] = photo || getRandomProfile(stdid, profileMap);
        }
      });
  
      setStudentProfiles(profiles); // ✅ อัปเดต state ให้ UI รีเรนเดอร์
    } catch (error) {
      console.error("Error fetching student profiles:", error);
    }
  };  
  
  // ✅ ฟังก์ชันดึงรูปจาก state
  const getProfilePicture = (stdid: string): string => {
    if (isGuestMode) {
      return getRandomProfile(stdid, profileMap);
    }
  
    return studentProfiles[stdid] || getRandomProfile(stdid, profileMap);
  };
  

  return (
    <>
      <title>Check-in Question</title>
      <div className="bg-gray-100 p-6" style={{ height: "calc(100vh - 80px)", overflowY: "auto" }}>
        <div className="max-w-5xl mx-auto bg-white p-6 shadow-lg rounded-lg">

          {/* ✅ Breadcrumb */}
          <div className="text-lg font-semibold mb-4">
            <Link href={`/classroom/${cid}`} className="text-black">
              Dashboard
            </Link>
            {" > "}
            <Link href={`/classroom/${cid}/check-in/${cno}`} className="text-black">
              Check-in
            </Link>
            {" > "}
            <span className="text-black cursor-pointer">
              {question?.question_text || "Loading..."}
            </span>
          </div>

          {question ? (
            <div className="mb-6">
              {/* ✅ ใช้ flex จัด layout */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-black">
                  คำถามที่ {question.question_no}
                </h3>
                
                {/* ✅ Toggle Switch - อยู่ด้านขวา */}
                <div className="flex items-center">
                  <span className="text-black mr-3">Guest Mode</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isGuestMode} 
                      onChange={() => setIsGuestMode((prev) => !prev)} 
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 
                      rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-5 
                      peer-checked:after:bg-white peer-checked:bg-blue-600 after:content-[''] 
                      after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border 
                      after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all">
                    </div>
                  </label>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-4 text-black">
                คำถาม : {question.question_text}
              </h3>

              <div className="bg-gray-100 p-4 rounded-lg shadow text-black">
                <h4 className="text-lg font-semibold mb-4">คำตอบจากนักเรียน:</h4>
                
                {/* ✅ กล่องเลื่อนข้อความ */}
                <div 
                  className="max-h-96 overflow-y-auto flex flex-col-reverse space-y-4 p-2 bg-white rounded-lg shadow-inner" 
                  ref={chatBoxRef}
                >
                  {question.answers && Object.keys(question.answers).length > 0 ? (
                    <ul className="space-y-4">
                    {question.answers &&
                      Object.entries(question.answers)
                        .sort(([, a], [, b]) => new Date(a.time).getTime() - new Date(b.time).getTime()) // ✅ เรียงจากเก่า → ใหม่
                        .map(([qno, answer]) => (
                          <li key={qno} className="flex items-start space-x-3">
                            {/* ✅ แสดงรูปโปรไฟล์ */}
                            <img 
                              src={getProfilePicture(answer.stdid)}
                              alt="Profile"
                              className="w-10 h-10 rounded-full"
                            />
                            {/* ✅ ส่วนของข้อความ */}
                            <div className="bg-gray-200 text-black p-3 rounded-lg w-fit max-w-xl overflow-hidden break-words">
                              {/* ✅ ชื่อ + เวลา */}
                              <div className="flex items-center space-x-2 text-black text-sm">
                                <span className="font-semibold text-black">
                                  {isGuestMode ? getRandomName(answer.stdid, nameMap) : answer.stdid}
                                </span>
                                <span className="text-xs">{formatDate(answer.time)}</span>
                              </div>
                              
                              {/* ✅ ข้อความตอบ */}
                              <p className="text-black text-base break-words whitespace-pre-wrap max-w-full">
                                {answer.text}
                              </p>
                            </div>
                          </li>
                        ))}
                  </ul>
                  
                  ) : (
                    <p className="text-gray-500">ยังไม่มีนักเรียนตอบ</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">ไม่มีคำถามนี้</p>
          )}
        </div>
      </div>
    </>
  );
}

async function getDocs(usersRef: CollectionReference<DocumentData>) {
  return await firestoreGetDocs(usersRef);
}

