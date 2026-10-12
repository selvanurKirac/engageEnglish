import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useUserAuth } from "../../context/UserAuthContext";
import Nav from "../../components/Nav";

const TimeChart = ({ Toggle }) => {
  const { user, loading: authLoading } = useUserAuth();
  const [chartData, setChartData] = useState([]);
  const [currentGoalMinutes, setCurrentGoalMinutes] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState("weekly");

  // Kullanıcı authentication kontrolü
  if (authLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-fluid px-4">
        <div className="row justify-content-center mt-5">
          <div className="col-md-6 text-center">
            <h3>Giriş Yapmanız Gerekiyor</h3>
            <p className="text-muted">
              Zaman grafiğini görüntülemek için lütfen giriş yapın.
            </p>
            <a href="/login" className="btn btn-primary">
              Giriş Yap
            </a>
          </div>
        </div>
      </div>
    );
  }

  // İlk kayıt ve ayarları kontrol et
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const checkUserSettings = async () => {
      try {
        setError(null);
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (
          isMounted &&
          userDoc.exists() &&
          userDoc.data().settings?.hasSetInitialGoal
        ) {
          setCurrentGoalMinutes(userDoc.data().settings.goalMinutes || 60);
        }

        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking user settings:", error);
        if (isMounted) {
          setError("Kullanıcı ayarları yüklenirken hata oluştu.");
          setLoading(false);
        }
      }
    };

    checkUserSettings();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Grafik verilerini al
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchChartData = async () => {
      if (!isMounted) return;

      try {
        const days = getDateRange(viewType);
        const data = [];

        // Son hedef süreyi al
        let lastGoalMinutes = currentGoalMinutes;

        // En son kayıttan hedef süreyi bul
        try {
          const recentQuery = query(
            collection(db, "dailyProgress", user.uid, "days"),
            orderBy("date", "desc"),
            limit(1)
          );

          const recentSnap = await getDocs(recentQuery);
          if (!recentSnap.empty && isMounted) {
            const recentData = recentSnap.docs[0].data();
            lastGoalMinutes = recentData.goalMinutes || lastGoalMinutes;
          }
        } catch (queryError) {
          console.log("No previous records found, using current goal");
        }

        if (!isMounted) return;

        // Yıllık görünüm için aylık toplamları hesapla
        if (viewType === "yearly") {
          const monthlyData = {};

          for (const day of days) {
            if (!isMounted) return;

            const dayRef = doc(db, "dailyProgress", user.uid, "days", day);
            const daySnap = await getDoc(dayRef);
            const monthKey = day.substring(0, 7); // YYYY-MM

            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = {
                totalMinutes: 0,
                goalMinutes: lastGoalMinutes,
                daysInMonth: 0,
              };
            }

            if (daySnap.exists()) {
              const dayData = daySnap.data();
              monthlyData[monthKey].totalMinutes += dayData.totalMinutes || 0;
              monthlyData[monthKey].goalMinutes =
                dayData.goalMinutes || monthlyData[monthKey].goalMinutes;
            }
            monthlyData[monthKey].daysInMonth++;
          }

          // Aylık verileri diziye çevir
          Object.keys(monthlyData).forEach((monthKey) => {
            if (!isMounted) return;
            data.push({
              date: formatDateForChart(monthKey + "-01"),
              totalMinutes: monthlyData[monthKey].totalMinutes,
              goalMinutes:
                monthlyData[monthKey].goalMinutes *
                monthlyData[monthKey].daysInMonth,
            });
          });
        } else {
          // Günlük ve haftalık görünüm
          for (const day of days) {
            if (!isMounted) return;

            const dayRef = doc(db, "dailyProgress", user.uid, "days", day);
            const daySnap = await getDoc(dayRef);

            if (daySnap.exists()) {
              const dayData = daySnap.data();
              lastGoalMinutes = dayData.goalMinutes || lastGoalMinutes;
              data.push({
                date: formatDateForChart(day),
                totalMinutes: dayData.totalMinutes || 0,
                goalMinutes: dayData.goalMinutes || lastGoalMinutes,
              });
            } else {
              data.push({
                date: formatDateForChart(day),
                totalMinutes: 0,
                goalMinutes: lastGoalMinutes,
              });
            }
          }
        }

        if (isMounted) {
          setChartData(data);
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
        if (isMounted) {
          setChartData([]);
        }
      }
    };

    fetchChartData();

    // Real-time listener
    const unsubscribe = onSnapshot(
      collection(db, "dailyProgress", user.uid, "days"),
      (snapshot) => {
        if (!snapshot.metadata.fromCache && isMounted) {
          fetchChartData();
        }
      },
      (error) => {
        console.error("Listener error:", error);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user, viewType, currentGoalMinutes]);

  // Tarih aralığı hesaplama
  const getDateRange = (type) => {
    const today = new Date();
    const dates = [];

    let daysCount;
    switch (type) {
      case "weekly":
        daysCount = 7;
        break;
      case "monthly":
        daysCount = 30;
        break;
      case "yearly":
        daysCount = 365;
        break;
      default:
        daysCount = 7;
    }

    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
    }

    return dates;
  };

  // Tarih formatı
  const formatDateForChart = (dateString) => {
    const date = new Date(dateString + "T12:00:00");
    if (viewType === "yearly") {
      return date.toLocaleDateString("tr-TR", {
        month: "short",
        year: "2-digit",
      });
    } else if (viewType === "monthly") {
      return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
      });
    } else {
      return date.toLocaleDateString("tr-TR", {
        weekday: "short",
        day: "2-digit",
      });
    }
  };

  // Tooltip formatlaması
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const totalMinutes = payload[0]?.value || 0;
      const goalMinutes = payload[1]?.value || 0;
      const totalHours = Math.floor(totalMinutes / 60);
      const remainingMinutes = Math.round(totalMinutes % 60);
      const goalHours = Math.floor(goalMinutes / 60);
      const goalRemainingMinutes = Math.round(goalMinutes % 60);

      return (
        <div
          className="bg-white p-3 border rounded shadow-lg"
          style={{ backgroundColor: "white", border: "1px solid #ddd" }}
        >
          <p className="fw-bold mb-2">{label}</p>
          <div className="d-flex align-items-center mb-1">
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#3B82F6",
                marginRight: "8px",
              }}
            ></div>
            <span>
              Çalışma: {totalHours > 0 ? `${totalHours}s ` : ""}
              {remainingMinutes}dk
            </span>
          </div>
          <div className="d-flex align-items-center">
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#EF4444",
                marginRight: "8px",
              }}
            ></div>
            <span>
              Hedef: {goalHours > 0 ? `${goalHours}s ` : ""}
              {goalRemainingMinutes}dk
            </span>
          </div>
          {totalMinutes > 0 && (
            <div className="mt-2 pt-2" style={{ borderTop: "1px solid #eee" }}>
              <small
                className={`fw-bold ${
                  totalMinutes >= goalMinutes ? "text-success" : "text-warning"
                }`}
              >
                {totalMinutes >= goalMinutes
                  ? "✅ Hedef tutturuldu!"
                  : `📈 %${Math.round(
                      (totalMinutes / goalMinutes) * 100
                    )} tamamlandı`}
              </small>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const formatDuration = (minutes) => {
    if (!minutes) return "0dk";
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
  };

  return (
    <>
      {Toggle && <Nav Toggle={Toggle} />}
      <div className="container-fluid px-4">
        <div className="row">
          <div className="col-12">
            {Toggle && <h1 className="h3 mb-4 text-dark">Zaman Grafiği</h1>}

            {/* Error State */}
            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {/* View Type Buttons */}
            <div className="mb-4">
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn ${
                    viewType === "weekly"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => setViewType("weekly")}
                >
                  Haftalık
                </button>
                <button
                  type="button"
                  className={`btn ${
                    viewType === "monthly"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => setViewType("monthly")}
                >
                  Aylık
                </button>
                <button
                  type="button"
                  className={`btn ${
                    viewType === "yearly"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => setViewType("yearly")}
                >
                  Yıllık
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">
                  {viewType === "weekly" && "Son 7 Günlük Çalışma Grafiği"}
                  {viewType === "monthly" && "Son 30 Günlük Çalışma Grafiği"}
                  {viewType === "yearly" && "Son 12 Aylık Çalışma Grafiği"}
                </h5>
              </div>
              <div className="card-body">
                {chartData.length === 0 ? (
                  <div className="text-center py-5">
                    <div
                      className="spinner-border text-primary mb-3"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted">Grafik verileri yükleniyor...</p>
                  </div>
                ) : (
                  <>
                    <div style={{ width: "100%", height: "400px" }}>
                      <ResponsiveContainer>
                        <LineChart
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f0f0f0"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            angle={viewType === "yearly" ? -45 : 0}
                            textAnchor={
                              viewType === "yearly" ? "end" : "middle"
                            }
                            height={viewType === "yearly" ? 60 : 30}
                          />
                          <YAxis
                            label={{
                              value: "Dakika",
                              angle: -90,
                              position: "insideLeft",
                            }}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="totalMinutes"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: "#1E40AF" }}
                            name="Çalışma Süresi"
                          />
                          <Line
                            type="monotone"
                            dataKey="goalMinutes"
                            stroke="#EF4444"
                            strokeWidth={2}
                            strokeDasharray="8 4"
                            dot={false}
                            activeDot={{ r: 4, fill: "#DC2626" }}
                            name="Hedef Süre"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* İstatistikler */}
                    <div
                      className="row mt-4 pt-3"
                      style={{ borderTop: "1px solid #eee" }}
                    >
                      <div className="col-md-3 col-6 text-center">
                        <div className="border-end">
                          <h6 className="text-primary mb-1">
                            {formatDuration(
                              chartData.reduce(
                                (sum, day) => sum + day.totalMinutes,
                                0
                              )
                            )}
                          </h6>
                          <small className="text-muted">Toplam Süre</small>
                        </div>
                      </div>
                      <div className="col-md-3 col-6 text-center">
                        <div className="border-end">
                          <h6 className="text-success mb-1">
                            {formatDuration(
                              chartData.reduce(
                                (sum, day) => sum + day.totalMinutes,
                                0
                              ) / chartData.length
                            )}
                          </h6>
                          <small className="text-muted">Günlük Ortalama</small>
                        </div>
                      </div>
                      <div className="col-md-3 col-6 text-center">
                        <div className="border-end">
                          <h6 className="text-warning mb-1">
                            {formatDuration(
                              Math.max(
                                ...chartData.map((day) => day.totalMinutes)
                              )
                            )}
                          </h6>
                          <small className="text-muted">En Uzun Gün</small>
                        </div>
                      </div>
                      <div className="col-md-3 col-6 text-center">
                        <h6 className="text-info mb-1">
                          %
                          {chartData.length > 0
                            ? Math.round(
                                (chartData.filter(
                                  (day) => day.totalMinutes >= day.goalMinutes
                                ).length /
                                  chartData.length) *
                                  100
                              )
                            : 0}
                        </h6>
                        <small className="text-muted">Hedef Tutturma</small>
                      </div>
                    </div>
                  </>
                )}

                {/* Legend */}
                <div className="mt-4 d-flex justify-content-center gap-4">
                  <div className="d-flex align-items-center">
                    <div
                      style={{
                        width: "20px",
                        height: "3px",
                        backgroundColor: "#3B82F6",
                        marginRight: "8px",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span className="small">Çalışma Süresi</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <div
                      style={{
                        width: "20px",
                        height: "3px",
                        backgroundColor: "#EF4444",
                        marginRight: "8px",
                        borderRadius: "2px",
                        backgroundImage:
                          "repeating-linear-gradient(to right, #EF4444 0, #EF4444 8px, transparent 8px, transparent 12px)",
                      }}
                    ></div>
                    <span className="small">Hedef Süre</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// AccountPage için hedef süre güncelleme fonksiyonu export
export const updateUserGoal = async (userId, newGoalMinutes) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      "settings.goalMinutes": newGoalMinutes,
      "settings.updatedAt": new Date(),
    });

    // Bugünün kaydını da güncelle
    const today = new Date().toISOString().split("T")[0];
    const todayRef = doc(db, "dailyProgress", userId, "days", today);
    const todaySnap = await getDoc(todayRef);

    if (todaySnap.exists()) {
      await updateDoc(todayRef, {
        goalMinutes: newGoalMinutes,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating user goal:", error);
    return { success: false, error: error.message };
  }
};

// Kullanıcının mevcut ayarlarını alma fonksiyonu
export const getUserSettings = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data().settings || {};
    }
    return {};
  } catch (error) {
    console.error("Error getting user settings:", error);
    return {};
  }
};

// Günlük istatistikleri alma fonksiyonu
export const getDailyStats = async (userId, days = 30) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const q = query(
      collection(db, "dailyProgress", userId, "days"),
      where("date", ">=", startDate.toISOString().split("T")[0]),
      where("date", "<=", endDate.toISOString().split("T")[0]),
      orderBy("date", "desc")
    );

    const querySnapshot = await getDocs(q);
    const stats = {
      totalMinutes: 0,
      totalDays: querySnapshot.size,
      goalAchievedDays: 0,
      averageMinutes: 0,
      longestSession: 0,
      currentStreak: 0,
    };

    let streak = 0;
    let checkingStreak = true;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stats.totalMinutes += data.totalMinutes || 0;

      if (data.totalMinutes >= data.goalMinutes) {
        stats.goalAchievedDays++;
        if (checkingStreak) streak++;
      } else {
        checkingStreak = false;
      }

      if (data.totalMinutes > stats.longestSession) {
        stats.longestSession = data.totalMinutes;
      }
    });

    stats.currentStreak = streak;
    stats.averageMinutes =
      stats.totalDays > 0 ? stats.totalMinutes / stats.totalDays : 0;

    return stats;
  } catch (error) {
    console.error("Error getting daily stats:", error);
    return null;
  }
};

export default TimeChart;
