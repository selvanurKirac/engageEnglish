import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { Card, Badge } from "react-bootstrap";
import { db } from "../../config/firebase";
import { useUserAuth } from "../../context/UserAuthContext";

const DailyProgress = () => {
  const { user } = useUserAuth();
  const [minutes, setMinutes] = useState(null);
  const [status, setStatus] = useState({ message: "", icon: "", color: "" });

  useEffect(() => {
    if (!user) return;

    const fetchProgress = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const docRef = doc(db, "users", user.uid, "dailyProgress", today);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const totalSeconds = snapshot.data().totalSeconds || 0;
        const mins = Math.floor(totalSeconds / 60);
        setMinutes(mins);

        // Duruma göre mesaj + ikon + renk belirle
        if (mins >= 15) {
          setStatus({
            message: "Günlük süre hedefini tamamladın!",
            icon: "🏁",
            color: "success", // Bootstrap green
          });
        } else if (mins >= 10) {
          setStatus({
            message: "Hedefe çok yaklaştın.",
            icon: "⏳",
            color: "info", // Bootstrap blue
          });
        } else if (mins >= 5) {
          setStatus({
            message: "Başlangıç yaptın, devam et.",
            icon: "🏃",
            color: "warning", // Bootstrap orange
          });
        } else {
          setStatus({
            message: "Bugün yeterince çalışmadın.",
            icon: "🙁",
            color: "danger", // Bootstrap red
          });
        }
      } else {
        setMinutes(0);
        setStatus({
          message: "Henüz çalışma yapılmadı.",
          icon: "📭",
          color: "secondary",
        });
      }
    };

    fetchProgress();
  }, [user]);

  return (
    <Card className="shadow-sm mt-4">
      <Card.Body>
        <Card.Title>🕒 Günlük Çalışma Süresi</Card.Title>
        <h5>
          {status.icon} <Badge bg={status.color}>{status.message}</Badge>
        </h5>
        <p className="mt-2">
          Bugünkü toplam süre:{" "}
          <strong>
            {minutes !== null ? `${minutes} dakika` : "Yükleniyor..."}
          </strong>
        </p>
      </Card.Body>
    </Card>
  );
};

export default DailyProgress;
