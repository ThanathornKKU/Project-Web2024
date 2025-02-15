// User Collection
interface User {
    uid: string;
    name: string;
    email: string;
    photo: string;
    classroom?: Record<string, UserClassroom>;
}

interface UserClassroom {
    status: 1 | 2; // 1 = อาจารย์, 2 = นักเรียน
}

// Classroom Collection
interface Classroom {
    cid: string;
    owner: string; // UID ของอาจารย์
    info: ClassroomInfo;
    students?: Record<string, Student>;
    checkin?: Record<string, Checkin>;
}

interface ClassroomInfo {
    code: string; // รหัสวิชา เช่น "SC310001"
    name: string; // ชื่อวิชา เช่น "Computer Programming"
    photo: string; // URL รูปภาพของวิชา
    room: string; // ชื่อห้องเรียน เช่น "SC5101"
}

interface Student {
    stdid: string; // รหัสนักเรียน
    name: string;
    status: 0 | 1; // 0 = ยังไม่ตรวจสอบ, 1 = ตรวจสอบแล้ว
}

// Checkin Collection
interface Checkin {
    cno: number; // ลำดับการเช็คชื่อ เช่น 1,2,3
    code: string; // รหัสเช็คชื่อ เช่น "ABC123"
    date: string; // วันเวลาที่เรียน เช่น "10/02/2025 13:00"
    status: 0 | 1 | 2; // 0 = ยังไม่เริ่ม, 1 = กำลังเช็คชื่อ, 2 = เสร็จแล้ว
    students?: Record<string, CheckinStudent>;
    scores?: Record<string, CheckinScore>;
    question_no?: number;
    question_text?: string;
    question_show?: boolean;
    answers?: Record<number, Answer>;
}

interface CheckinStudent {
    stdid: string;
    name: string;
    remark?: string;
    date: string; // วันเวลาที่เข้าเรียน เช่น "10/02/2025 13:00"
}

interface CheckinScore {
    date: string; // วันเวลาที่เข้าเรียน เช่น "10/02/2025 13:00"
    name: string;
    uid: string;
    remark?: string;
    score?: number;
    status: 0 | 1 | 2; // 0: ไม่มา, 1: มาเรียน, 2: มาสาย
}

interface Answer {
    text: string;
    students: Record<string, StudentAnswer>;
}

interface StudentAnswer {
    text: string; // คำตอบของนักเรียน
    time: string; // เวลาส่งคำตอบ
}
