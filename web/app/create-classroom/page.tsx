// "use client";
// import { useAuth } from "@/contexts/authContext";
// import { db } from "@/lib/firebase";
// import { addDoc, collection, doc, setDoc } from "firebase/firestore";
// import { useState } from "react";
// import { useRouter } from "next/navigation";

// export default function CreateClassroom() {
//   const { user } = useAuth();
//   const router = useRouter();
//   const [form, setForm] = useState({ code: "", name: "", room: "", image: "" });

//   const handleSubmit = async () => {
//     if (!user) return;

//     const docRef = await addDoc(collection(db, "classroom"), form);
//     await setDoc(doc(db, `users/${user.uid}/classroom/${docRef.id}`), { status: 1 });

//     router.push("/");
//   };

//   return (
//     <div className="p-5">
//       <h1>เพิ่มวิชา</h1>
//       <input placeholder="รหัสวิชา" className="border p-2 block" onChange={(e) => setForm({ ...form, code: e.target.value })} />
//       <input placeholder="ชื่อวิชา" className="border p-2 block" onChange={(e) => setForm({ ...form, name: e.target.value })} />
//       <input placeholder="ชื่อห้องเรียน" className="border p-2 block" onChange={(e) => setForm({ ...form, room: e.target.value })} />
//       <input placeholder="ลิงก์รูปภาพ" className="border p-2 block" onChange={(e) => setForm({ ...form, image: e.target.value })} />
//       <button className="bg-blue-500 text-white p-2 mt-2" onClick={handleSubmit}>บันทึก</button>
//     </div>
//   );
// }