"use client";
import { useParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

export default function ClassroomPage() {
  const { cid } = useParams();

  return (
    <div className="p-5">
      <h1>จัดการห้องเรียน</h1>
      <p>รหัสวิชา: {cid}</p>
      <QRCodeCanvas value={cid as string} size={200} />
      <button className="bg-blue-500 text-white p-2 mt-2">เพิ่มการเช็คชื่อ</button>
    </div>
  );
}