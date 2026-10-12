import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { useUserAuth } from "../context/UserAuthContext";
import Nav from "../components/Nav";

const StreakChart = ({ Toggle, embedded = false }) => {
  const { user, loading: authLoading } = useUserAuth();
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState("timeline");
  const [timeRange, setTimeRange] = useState(30);
  const [userDefaultGoal, setUserDefaultGoal] = useState(60);

  // Early returns
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
              Streak analizi için lütfen giriş yapın.
            </p>
            <a href="/login" className="btn btn-primary">
              Giriş Yap
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Calculate streak statistics
  function calculateStreakStats(data) {
    if (!data.length)
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalAchievedDays: 0,
        achievementRate: 0,
        streakHistory: [],
        totalDays: 0,
      };

    let currentStreak = 0;
    let longestStreak = 0;
    let streakHistory = [];
    let tempStreak = 0;
    let tempStreakStart = null;

    // Calculate current streak (from most recent backwards)
    const sortedData = [...data].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    for (let i = 0; i < sortedData.length; i++) {
      if (sortedData[i].achieved) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak and history (forward chronological)
    const forwardData = [...data].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    forwardData.forEach((day, index) => {
      if (day.achieved) {
        if (tempStreak === 0) {
          tempStreakStart = day.date;
        }
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (tempStreak > 0) {
          streakHistory.push({
            length: tempStreak,
            startDate: tempStreakStart,
            endDate: forwardData[index - 1].date,
          });
        }
        tempStreak = 0;
        tempStreakStart = null;
      }
    });

    // Add final streak if data ends with achieved days
    if (tempStreak > 0) {
      streakHistory.push({
        length: tempStreak,
        startDate: tempStreakStart,
        endDate: forwardData[forwardData.length - 1].date,
      });
    }

    const totalAchievedDays = data.filter((day) => day.achieved).length;
    const achievementRate = (totalAchievedDays / data.length) * 100;

    return {
      currentStreak,
      longestStreak,
      totalAchievedDays,
      achievementRate: Math.round(achievementRate),
      streakHistory,
      totalDays: data.length,
    };
  }

  // Memoized calculations
  const streakStats = useMemo(() => {
    return calculateStreakStats(dailyData);
  }, [dailyData]);

  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const dates = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  }, [timeRange]);

  // Optimized fetch function with parallel requests
  const fetchStreakData = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      setLoading(true);

      // Get user's default goal first (only once)
      const userDocPromise = getDoc(doc(db, "users", user.uid));

      // Create all date document promises (parallel execution)
      const dayPromises = dateRange.map((date) => {
        const dayRef = doc(db, "dailyProgress", user.uid, "days", date);
        return getDoc(dayRef).then((daySnap) => ({ date, daySnap }));
      });

      // Execute all promises in parallel
      const [userDoc, ...dayResults] = await Promise.all([
        userDocPromise,
        ...dayPromises,
      ]);

      // Get default goal
      const defaultGoal = userDoc.exists()
        ? userDoc.data().settings?.goalMinutes || 60
        : 60;

      setUserDefaultGoal(defaultGoal);

      // Process results
      const dailyProgress = dayResults.map(({ date, daySnap }) => {
        if (daySnap.exists()) {
          const dayData = daySnap.data();
          return {
            date,
            totalMinutes: dayData.totalMinutes || 0,
            goalMinutes: dayData.goalMinutes || defaultGoal,
            goalHistory: dayData.goalHistory || [],
            sessions: dayData.sessions || [],
            achieved:
              (dayData.totalMinutes || 0) >=
              (dayData.goalMinutes || defaultGoal),
          };
        } else {
          return {
            date,
            totalMinutes: 0,
            goalMinutes: defaultGoal,
            goalHistory: [],
            sessions: [],
            achieved: false,
          };
        }
      });

      // Sort by date (oldest first)
      dailyProgress.sort((a, b) => new Date(a.date) - new Date(b.date));

      setDailyData(dailyProgress);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching streak data:", err);
      setError("Streak verileri yüklenirken hata oluştu.");
      setLoading(false);
    }
  }, [user, dateRange]);

  useEffect(() => {
    let isMounted = true;

    if (user) {
      fetchStreakData();

      // Set up real-time listener (debounced)
      let timeoutId;
      const unsubscribe = onSnapshot(
        collection(db, "dailyProgress", user.uid, "days"),
        () => {
          if (isMounted) {
            // Debounce rapid updates
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              fetchStreakData();
            }, 500);
          }
        },
        (error) => {
          console.error("Listener error:", error);
        }
      );

      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
        unsubscribe();
      };
    }
  }, [user, fetchStreakData]);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString + "T12:00:00");
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
    });
  }, []);

  const formatDateLong = useCallback((dateString) => {
    const date = new Date(dateString + "T12:00:00");
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

  const formatDuration = useCallback((minutes) => {
    if (!minutes) return "0dk";
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
  }, []);

  const formatTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const isToday = useCallback((dateString) => {
    const today = new Date().toISOString().split("T")[0];
    return dateString === today;
  }, []);

  const CustomTooltip = useCallback(
    ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        const day = payload[0].payload;

        return (
          <div
            className="bg-white p-3 border rounded shadow-lg"
            style={{ maxWidth: "300px" }}
          >
            <h6 className="fw-bold">{formatDateLong(label)}</h6>

            <div className="mb-2">
              <div className="d-flex justify-content-between">
                <span>Çalışma:</span>
                <span className="fw-bold">
                  {formatDuration(day.totalMinutes)}
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Hedef:</span>
                <span className="fw-bold">{day.goalMinutes}dk</span>
              </div>
            </div>

            <div
              className={`badge ${
                day.achieved ? "bg-success" : "bg-danger"
              } w-100`}
            >
              {day.achieved ? "🔥 Streak Günü" : "💔 Streak Kırıldı"}
            </div>

            {day.goalHistory && day.goalHistory.length > 0 && (
              <div className="mt-2 pt-2 border-top">
                <small className="text-muted">Hedef değişimleri:</small>
                {day.goalHistory.map((change, i) => (
                  <div key={i} className="small">
                    {formatTime(change.timestamp)}: {change.previousGoal}dk →{" "}
                    {change.newGoal}dk
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      return null;
    },
    [formatDateLong, formatDuration, formatTime]
  );

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div>
      {!embedded && <Nav Toggle={Toggle} />}
      <div className="container-fluid px-4">
        <div className="row">
          <div className="col-12">
            {!embedded && (
              <div className="h3 mb-4 placeholder-glow">
                <span className="placeholder col-3"></span>
              </div>
            )}

            <div className="row mb-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="col-md-3 col-6 mb-3">
                  <div className="card text-center h-100">
                    <div className="card-body placeholder-glow">
                      <div
                        className="placeholder col-8 mb-2"
                        style={{ height: "2rem" }}
                      ></div>
                      <div
                        className="placeholder col-6"
                        style={{ height: "1rem" }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-body placeholder-glow">
                <div
                  className="placeholder col-12"
                  style={{ height: "400px" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      {!embedded && <Nav Toggle={Toggle} />}
      <div className="container-fluid px-4">
        <div className="row">
          <div className="col-12">
            {!embedded && (
              <h1 className="h3 mb-4 text-dark">🔥 Streak Analizi</h1>
            )}

            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {!embedded && (
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn ${
                        viewType === "timeline"
                          ? "btn-primary"
                          : "btn-outline-primary"
                      }`}
                      onClick={() => setViewType("timeline")}
                    >
                      Timeline
                    </button>
                    <button
                      type="button"
                      className={`btn ${
                        viewType === "calendar"
                          ? "btn-primary"
                          : "btn-outline-primary"
                      }`}
                      onClick={() => setViewType("calendar")}
                    >
                      Takvim
                    </button>
                    <button
                      type="button"
                      className={`btn ${
                        viewType === "stats"
                          ? "btn-primary"
                          : "btn-outline-primary"
                      }`}
                      onClick={() => setViewType("stats")}
                    >
                      İstatistikler
                    </button>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        timeRange === 7
                          ? "btn-secondary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => setTimeRange(7)}
                    >
                      7 Gün
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        timeRange === 30
                          ? "btn-secondary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => setTimeRange(30)}
                    >
                      30 Gün
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        timeRange === 90
                          ? "btn-secondary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => setTimeRange(90)}
                    >
                      90 Gün
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="row mb-4">
              <div className="col-md-3 col-6 mb-3">
                <div className="card text-center h-100">
                  <div className="card-body">
                    <h2 className="text-primary mb-1">
                      {streakStats.currentStreak || 0}
                    </h2>
                    <small className="text-muted">Mevcut Streak</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6 mb-3">
                <div className="card text-center h-100">
                  <div className="card-body">
                    <h2 className="text-success mb-1">
                      {streakStats.longestStreak || 0}
                    </h2>
                    <small className="text-muted">En Uzun Streak</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6 mb-3">
                <div className="card text-center h-100">
                  <div className="card-body">
                    <h2 className="text-info mb-1">
                      {streakStats.totalAchievedDays || 0}
                    </h2>
                    <small className="text-muted">Başarılı Gün</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6 mb-3">
                <div className="card text-center h-100">
                  <div className="card-body">
                    <h2 className="text-warning mb-1">
                      %{streakStats.achievementRate || 0}
                    </h2>
                    <small className="text-muted">Başarı Oranı</small>
                  </div>
                </div>
              </div>
            </div>

            {(viewType === "timeline" || embedded) && (
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">🔥 Streak Timeline</h5>
                </div>
                <div className="card-body">
                  <div style={{ width: "100%", height: "400px" }}>
                    <ResponsiveContainer>
                      <LineChart
                        data={dailyData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          tick={{ fontSize: 12 }}
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
                          key="totalMinutes"
                          type="monotone"
                          dataKey="totalMinutes"
                          stroke="#3B82F6"
                          strokeWidth={3}
                          dot={(props) => {
                            const { payload } = props;
                            return (
                              <circle
                                key={`dot-${props.cx}-${props.cy}`}
                                cx={props.cx}
                                cy={props.cy}
                                fill={payload.achieved ? "#22C55E" : "#EF4444"}
                                stroke={
                                  payload.achieved ? "#16A34A" : "#DC2626"
                                }
                                strokeWidth={2}
                                r={6}
                              />
                            );
                          }}
                        />
                        <Line
                          key="goalMinutes"
                          type="monotone"
                          dataKey="goalMinutes"
                          stroke="#EF4444"
                          strokeWidth={2}
                          strokeDasharray="8 4"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-3 d-flex justify-content-center gap-4">
                    <div className="d-flex align-items-center">
                      <div
                        style={{
                          width: "20px",
                          height: "3px",
                          backgroundColor: "#3B82F6",
                          marginRight: "8px",
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
                          backgroundImage:
                            "repeating-linear-gradient(to right, #EF4444 0, #EF4444 8px, transparent 8px, transparent 12px)",
                        }}
                      ></div>
                      <span className="small">Hedef Süre</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          backgroundColor: "#22C55E",
                          borderRadius: "50%",
                          marginRight: "8px",
                        }}
                      ></div>
                      <span className="small">Başarılı Gün</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          backgroundColor: "#EF4444",
                          borderRadius: "50%",
                          marginRight: "8px",
                        }}
                      ></div>
                      <span className="small">Başarısız Gün</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!embedded && viewType === "calendar" && (
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">📅 Streak Takvimi</h5>
                </div>
                <div className="card-body">
                  <div className="streak-calendar d-flex gap-1 flex-wrap">
                    {dailyData.map((day, i) => (
                      <div
                        key={i}
                        className="streak-day position-relative"
                        title={`${formatDateLong(day.date)}: ${formatDuration(
                          day.totalMinutes
                        )} / ${day.goalMinutes}dk ${
                          day.achieved ? "✅" : "❌"
                        }`}
                        style={{
                          width: "25px",
                          height: "25px",
                          backgroundColor: day.achieved ? "#22C55E" : "#EF4444",
                          border:
                            day.goalHistory?.length > 0
                              ? "2px solid #F59E0B"
                              : "1px solid #E5E7EB",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        {isToday(day.date) && (
                          <div
                            style={{
                              position: "absolute",
                              top: "-2px",
                              right: "-2px",
                              width: "8px",
                              height: "8px",
                              backgroundColor: "#3B82F6",
                              borderRadius: "50%",
                              border: "1px solid white",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 small text-muted">
                    🟢 Başarılı gün 🔴 Başarısız gün 🟡 Hedef değişimi 🔵 Bugün
                  </div>
                </div>
              </div>
            )}

            {!embedded && viewType === "stats" && (
              <div className="row">
                <div className="col-md-8">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="card-title mb-0">📊 Streak Uzunlukları</h5>
                    </div>
                    <div className="card-body">
                      {streakStats.streakHistory &&
                      streakStats.streakHistory.length > 0 ? (
                        <div style={{ width: "100%", height: "300px" }}>
                          <ResponsiveContainer>
                            <BarChart
                              data={streakStats.streakHistory.map(
                                (streak, i) => ({ ...streak, index: i + 1 })
                              )}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="index"
                                label={{
                                  value: "Streak #",
                                  position: "insideBottom",
                                  offset: -5,
                                }}
                              />
                              <YAxis
                                label={{
                                  value: "Gün",
                                  angle: -90,
                                  position: "insideLeft",
                                }}
                              />
                              <Tooltip
                                formatter={(value, name, props) => [
                                  `${value} gün`,
                                  `${formatDateLong(
                                    props.payload.startDate
                                  )} - ${formatDateLong(
                                    props.payload.endDate
                                  )}`,
                                ]}
                              />
                              <Bar dataKey="length" fill="#3B82F6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted">
                          Henüz streak geçmişi bulunmuyor
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="card-title mb-0">🏆 Streak Rekorları</h5>
                    </div>
                    <div className="card-body">
                      {streakStats.streakHistory &&
                      streakStats.streakHistory.length > 0 ? (
                        <div>
                          {streakStats.streakHistory
                            .sort((a, b) => b.length - a.length)
                            .slice(0, 5)
                            .map((streak, i) => (
                              <div
                                key={i}
                                className="d-flex justify-content-between align-items-center mb-2"
                              >
                                <div>
                                  <span className="fw-bold">#{i + 1}</span>
                                  <small className="text-muted ms-2">
                                    {formatDate(streak.startDate)} -{" "}
                                    {formatDate(streak.endDate)}
                                  </small>
                                </div>
                                <span className="badge bg-primary">
                                  {streak.length} gün
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted">
                          Henüz streak kaydı yok
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakChart;
