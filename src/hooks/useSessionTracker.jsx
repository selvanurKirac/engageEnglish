// src/hooks/useSessionTracker.jsx
import React, { useEffect, useRef, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useUserAuth } from "../context/UserAuthContext";
console.log("🔥 NEW VERSION LOADED - useSessionTracker.jsx");
export const useSessionTracker = () => {
  const { user } = useUserAuth();
  const sessionStartRef = useRef(null);
  const lastUpdateRef = useRef(null);
  const currentGoalRef = useRef(60);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastCheckedUserRef = useRef(null);

  // Debug: Modal state'ini takip et
  useEffect(() => {
    console.log("🎭 Modal state changed:", showGoalModal);
  }, [showGoalModal]);

  // Debug: Kullanıcı değişimini takip et
  useEffect(() => {
    console.log("🔍 User changed:", user?.uid);
    console.log("🔍 Last checked user:", lastCheckedUserRef.current);
    console.log(
      "🔍 Should show modal?",
      user && user.uid !== lastCheckedUserRef.current
    );
  }, [user]);

  // Kullanıcı değiştiğinde FORCE kontrolü
  useEffect(() => {
    if (!user) {
      console.log("❌ No user, resetting states");
      setShowGoalModal(false);
      lastCheckedUserRef.current = null;
      return;
    }

    // Eğer aynı kullanıcıysa skip
    if (lastCheckedUserRef.current === user.uid) {
      console.log("⏭️ Same user, skipping check");
      return;
    }

    console.log("🆕 New user detected, checking settings...");

    const checkUserSettings = async () => {
      try {
        console.log("📡 Fetching user document for:", user.uid);

        // Firebase'den fresh veri al
        const userDoc = await getDoc(doc(db, "users", user.uid));

        console.log("📄 User document exists:", userDoc.exists());

        if (!userDoc.exists()) {
          console.log("🎯 No document found, showing modal");
          setShowGoalModal(true);
        } else {
          const userData = userDoc.data();
          console.log("📊 User data:", userData);

          // Settings yoksa veya hasSetInitialGoal false/undefined ise modal göster
          const hasSettings = userData.settings;
          const hasSetGoal = userData.settings?.hasSetInitialGoal;

          console.log("⚙️ Has settings:", !!hasSettings);
          console.log("✅ Has set initial goal:", hasSetGoal);

          if (!hasSettings || !hasSetGoal) {
            console.log(
              "🎯 Settings missing or no initial goal set, showing modal"
            );
            setShowGoalModal(true);
          } else {
            console.log("✅ Goal already set, hiding modal");
            currentGoalRef.current = userData.settings.goalMinutes || 60;
            setShowGoalModal(false);
          }
        }

        // Bu kullanıcıyı kontrol ettiğimizi kaydet
        lastCheckedUserRef.current = user.uid;
      } catch (error) {
        console.error("❌ Error checking user settings:", error);
        lastCheckedUserRef.current = user.uid;
      }
    };

    // Immediate check
    checkUserSettings();
  }, [user?.uid]); // Sadece user.uid'e dependency

  // Hedef süre ayarlama
  const handleSetGoal = async (goalMinutes) => {
    if (!user) return;

    try {
      setLoading(true);
      console.log("💾 Setting goal:", goalMinutes, "for user:", user.uid);

      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          email: user.email,
          settings: {
            goalMinutes: goalMinutes,
            hasSetInitialGoal: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { merge: true }
      );

      currentGoalRef.current = goalMinutes;
      setShowGoalModal(false);
      setLoading(false);

      console.log("✅ Goal set successfully");
    } catch (error) {
      console.error("❌ Error setting goal:", error);
      setLoading(false);
      alert("Hedef ayarlanırken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  // Oturum süresini güncelle
  const updateSessionTime = async () => {
    if (!user || !lastUpdateRef.current || showGoalModal) return;

    const now = new Date();
    const sessionDuration = (now - lastUpdateRef.current) / (1000 * 60);

    if (sessionDuration < 0.1) return;

    const today = now.toISOString().split("T")[0];
    const dailyProgressRef = doc(db, "dailyProgress", user.uid, "days", today);

    try {
      const docSnap = await getDoc(dailyProgressRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const newTotalMinutes =
          Math.round(((data.totalMinutes || 0) + sessionDuration) * 100) / 100;
        const newSessions = [
          ...(data.sessions || []),
          {
            startTime: lastUpdateRef.current,
            endTime: now,
            duration: Math.round(sessionDuration * 100) / 100,
          },
        ];

        await updateDoc(dailyProgressRef, {
          totalMinutes: newTotalMinutes,
          sessions: newSessions,
          lastUpdate: now,
        });
      } else {
        await setDoc(dailyProgressRef, {
          date: today,
          goalMinutes: currentGoalRef.current,
          totalMinutes: Math.round(sessionDuration * 100) / 100,
          sessions: [
            {
              startTime: lastUpdateRef.current,
              endTime: now,
              duration: Math.round(sessionDuration * 100) / 100,
            },
          ],
          lastUpdate: now,
        });
      }

      lastUpdateRef.current = now;
    } catch (error) {
      console.error("Error updating session time:", error);
      setTimeout(() => {
        if (lastUpdateRef.current) {
          updateSessionTime();
        }
      }, 5000);
    }
  };

  // Global oturum takip sistemi
  useEffect(() => {
    if (!user || showGoalModal) return;

    console.log("🚀 Starting session tracking for user:", user.uid);

    sessionStartRef.current = new Date();
    lastUpdateRef.current = new Date();

    const interval = setInterval(() => {
      if (!document.hidden && document.hasFocus()) {
        updateSessionTime();
      }
    }, 30000);

    const handleBeforeUnload = () => {
      updateSessionTime();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateSessionTime();
      } else {
        lastUpdateRef.current = new Date();
      }
    };

    const handleFocus = () => {
      lastUpdateRef.current = new Date();
    };

    const handleBlur = () => {
      updateSessionTime();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      updateSessionTime();
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [user, showGoalModal]);

  // Goal Modal Component
  const GoalModal = () => {
    console.log("🎭 GoalModal render called, showGoalModal:", showGoalModal);

    if (!showGoalModal) {
      console.log("🚫 Modal not showing, returning null");
      return null;
    }

    console.log("✅ Modal should be visible!");

    return (
      <div
        className="modal d-block"
        style={{
          backgroundColor: "rgba(0,0,0,0.8)",
          zIndex: 9999,
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
        }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-0 pb-0">
              <div className="w-100 text-center">
                <div className="mb-3">
                  <i
                    className="bi bi-target"
                    style={{ fontSize: "3rem", color: "#3B82F6" }}
                  ></i>
                </div>
                <h5 className="modal-title">Hoş Geldiniz! 🎯</h5>
                <p className="text-muted mb-0">
                  Günlük İngilizce çalışma hedefinizi belirleyin
                </p>
                <small className="text-info d-block mt-2">
                  Kullanıcı ID: {user?.uid?.substring(0, 8)}...
                </small>
                <small className="text-success d-block">
                  DEBUG: Modal görünür!
                </small>
              </div>
            </div>
            <div className="modal-body pt-2">
              <p className="text-center text-muted small mb-4">
                Bu hedef daha sonra hesap ayarlarından değiştirilebilir
              </p>
              <div className="d-grid gap-3">
                {[
                  {
                    minutes: 30,
                    label: "30 dakika",
                    desc: "Başlangıç seviyesi",
                    icon: "🌱",
                  },
                  {
                    minutes: 60,
                    label: "1 saat",
                    desc: "Orta seviye (önerilen)",
                    icon: "🎯",
                    recommended: true,
                  },
                  {
                    minutes: 90,
                    label: "1.5 saat",
                    desc: "İleri seviye",
                    icon: "🚀",
                  },
                  {
                    minutes: 120,
                    label: "2 saat",
                    desc: "Yoğun çalışma",
                    icon: "💪",
                  },
                ].map(({ minutes, label, desc, icon, recommended }) => (
                  <button
                    key={minutes}
                    className={`btn ${
                      recommended ? "btn-primary" : "btn-outline-primary"
                    } p-3 text-start position-relative`}
                    onClick={() => handleSetGoal(minutes)}
                    disabled={loading}
                    style={{ borderRadius: "12px" }}
                  >
                    <div className="d-flex align-items-center">
                      <span style={{ fontSize: "1.5rem", marginRight: "12px" }}>
                        {icon}
                      </span>
                      <div className="flex-grow-1">
                        <div className="fw-bold">{label}</div>
                        <small
                          className={
                            recommended ? "text-white-50" : "text-muted"
                          }
                        >
                          {desc}
                        </small>
                      </div>
                      {recommended && (
                        <span className="badge bg-warning text-dark small">
                          ÖNERİLEN
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div
                className="mt-4 p-3 bg-light rounded"
                style={{ borderRadius: "12px" }}
              >
                <div className="d-flex align-items-center">
                  <i className="bi bi-info-circle text-primary me-2"></i>
                  <small className="text-muted">
                    <strong>İpucu:</strong> Küçük hedeflerle başlayıp zamanla
                    artırabilirsiniz. Düzenli çalışma, uzun süreli çalışmadan
                    daha etkilidir.
                  </small>
                </div>
              </div>
              {loading && (
                <div className="text-center mt-3">
                  <div
                    className="spinner-border spinner-border-sm text-primary me-2"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span>Hedef ayarlanıyor...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return {
    updateSessionTime,
    getCurrentGoal: () => currentGoalRef.current,
    setCurrentGoal: (goal) => {
      currentGoalRef.current = goal;
    },
    showGoalModal,
    GoalModal,
  };
};
