import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { db } from "../../config/firebase";
import { useUserAuth } from "../../context/UserAuthContext";
import { updateUserGoal, getUserSettings } from "../timeChart/TimeChart";
import TimeChart from "../timeChart/TimeChart";
import StreakChart from "../../components/StreakChart";
import Nav from "../../components/Nav";

const AccountPage = ({ Toggle }) => {
  const { user, logOut } = useUserAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userSettings, setUserSettings] = useState({});

  // Goal settings
  const [currentGoal, setCurrentGoal] = useState(60);
  const [newGoal, setNewGoal] = useState(60);
  const [goalLoading, setGoalLoading] = useState(false);

  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Kullanıcı verilerini yükle
  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      try {
        setLoading(true);
        setError("");

        // Kullanıcı ayarlarını al
        const settings = await getUserSettings(user.uid);
        setUserSettings(settings);
        setCurrentGoal(settings.goalMinutes || 60);
        setNewGoal(settings.goalMinutes || 60);

        setLoading(false);
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("Kullanıcı verileri yüklenirken hata oluştu.");
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  // Hedef süre güncelleme
  const handleGoalUpdate = async () => {
    if (!user || newGoal === currentGoal) return;

    if (newGoal < 5 || newGoal > 480) {
      setError("Hedef süre 5-480 dakika arasında olmalıdır.");
      return;
    }

    try {
      setGoalLoading(true);
      setError("");
      setSuccess("");

      const result = await updateUserGoal(user.uid, newGoal);

      if (result.success) {
        setCurrentGoal(newGoal);
        setSuccess("Hedef süre başarıyla güncellendi!");

        // Güncel ayarları tekrar yükle
        const updatedSettings = await getUserSettings(user.uid);
        setUserSettings(updatedSettings);
      } else {
        setError(result.error || "Hedef süre güncellenirken hata oluştu.");
      }
    } catch (err) {
      console.error("Error updating goal:", err);
      setError("Hedef süre güncellenirken hata oluştu.");
    } finally {
      setGoalLoading(false);
    }
  };

  // Şifre değiştirme
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Yeni şifreler eşleşmiyor.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError("Lütfen tüm alanları doldurun.");
      return;
    }

    try {
      setPasswordLoading(true);
      setError("");
      setSuccess("");

      // Mevcut şifre ile yeniden doğrulama
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );

      await reauthenticateWithCredential(user, credential);

      // Şifre güncelleme
      await updatePassword(user, passwordData.newPassword);

      setSuccess("Şifre başarıyla güncellendi!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordChange(false);
    } catch (err) {
      console.error("Error updating password:", err);
      if (err.code === "auth/wrong-password") {
        setError("Mevcut şifre yanlış.");
      } else if (err.code === "auth/weak-password") {
        setError("Yeni şifre çok zayıf.");
      } else if (err.code === "auth/invalid-credential") {
        setError("Mevcut şifre yanlış.");
      } else {
        setError("Şifre güncellenirken hata oluştu: " + err.message);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Çıkış yapma
  const handleLogout = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error("Error signing out:", err);
      setError("Çıkış yapılırken hata oluştu.");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Bilinmiyor";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "0dk";
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
  };

  if (loading) {
    return (
      <>
        <Nav Toggle={Toggle} />
        <div className="container-fluid px-4">
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "50vh" }}
          >
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav Toggle={Toggle} />
      <div className="container-fluid px-4">
        <div className="row">
          <div className="col-12">
            <h1 className="h3 mb-4 text-dark">Hesap Ayarları</h1>

            {/* Alert Messages */}
            {error && (
              <div
                className="alert alert-danger alert-dismissible fade show"
                role="alert"
              >
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setError("")}
                ></button>
              </div>
            )}

            {success && (
              <div
                className="alert alert-success alert-dismissible fade show"
                role="alert"
              >
                <i className="bi bi-check-circle me-2"></i>
                {success}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSuccess("")}
                ></button>
              </div>
            )}

            <div className="row">
              {/* Profile Information */}
              <div className="col-lg-6 mb-4">
                <div className="card h-100">
                  <div className="card-header bg-primary text-white">
                    <h5 className="card-title mb-0">
                      <i className="bi bi-person-circle me-2"></i>
                      Profil Bilgileri
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-sm-6 mb-3">
                        <label className="text-muted small">E-posta</label>
                        <div className="fw-bold">{user?.email}</div>
                      </div>
                      <div className="col-sm-6 mb-3">
                        <label className="text-muted small">Kayıt Tarihi</label>
                        <div className="fw-bold">
                          {userSettings.createdAt
                            ? formatDate(userSettings.createdAt)
                            : "Bilinmiyor"}
                        </div>
                      </div>
                      <div className="col-sm-6 mb-3">
                        <label className="text-muted small">
                          Son Güncelleme
                        </label>
                        <div className="fw-bold">
                          {userSettings.updatedAt
                            ? formatDate(userSettings.updatedAt)
                            : "Bilinmiyor"}
                        </div>
                      </div>
                      <div className="col-sm-6 mb-3">
                        <label className="text-muted small">Mevcut Hedef</label>
                        <div className="fw-bold text-primary">
                          {formatDuration(currentGoal)}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-grid gap-2 mt-3">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() =>
                          setShowPasswordChange(!showPasswordChange)
                        }
                      >
                        <i className="bi bi-lock me-2"></i>
                        {showPasswordChange
                          ? "Şifre Değiştirmeyi İptal Et"
                          : "Şifre Değiştir"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goal Settings */}
              <div className="col-lg-6 mb-4">
                <div className="card h-100">
                  <div className="card-header bg-success text-white">
                    <h5 className="card-title mb-0">
                      <i className="bi bi-target me-2"></i>
                      Hedef Süre Ayarları
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        Günlük Çalışma Hedefi
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          value={newGoal}
                          onChange={(e) =>
                            setNewGoal(parseInt(e.target.value) || 60)
                          }
                          min="5"
                          max="480"
                          disabled={goalLoading}
                        />
                        <span className="input-group-text">dakika</span>
                      </div>
                      <div className="form-text">
                        5-480 dakika arasında bir değer girin. Önerilen: 60
                        dakika
                      </div>
                    </div>

                    {/* Quick Goal Options */}
                    <div className="mb-3">
                      <label className="form-label small text-muted">
                        Hızlı Seçenekler
                      </label>
                      <div className="d-flex gap-2 flex-wrap">
                        {[30, 60, 90, 120].map((minutes) => (
                          <button
                            key={minutes}
                            type="button"
                            className={`btn btn-sm ${
                              newGoal === minutes
                                ? "btn-primary"
                                : "btn-outline-primary"
                            }`}
                            onClick={() => setNewGoal(minutes)}
                            disabled={goalLoading}
                          >
                            {formatDuration(minutes)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {newGoal !== currentGoal && (
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        Mevcut hedef: {formatDuration(currentGoal)} → Yeni
                        hedef: {formatDuration(newGoal)}
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-success w-100"
                      onClick={handleGoalUpdate}
                      disabled={goalLoading || newGoal === currentGoal}
                    >
                      {goalLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></span>
                          Güncelleniyor...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Hedef Güncelle
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              {showPasswordChange && (
                <div className="col-12 mb-4">
                  <div className="card">
                    <div className="card-header bg-warning">
                      <h5 className="card-title mb-0">
                        <i className="bi bi-shield-lock me-2"></i>
                        🔐 Şifre Değiştir
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="row justify-content-center">
                        <div className="col-md-6">
                          {/* Current Password */}
                          <div className="mb-3">
                            <label className="form-label">Mevcut Şifre</label>
                            <div className="input-group">
                              <input
                                type={showCurrentPassword ? "text" : "password"}
                                className="form-control"
                                value={passwordData.currentPassword}
                                onChange={(e) =>
                                  setPasswordData({
                                    ...passwordData,
                                    currentPassword: e.target.value,
                                  })
                                }
                                placeholder="Mevcut şifrenizi girin"
                                disabled={passwordLoading}
                                required
                              />
                              <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() =>
                                  setShowCurrentPassword(!showCurrentPassword)
                                }
                              >
                                <i
                                  className={`bi ${
                                    showCurrentPassword
                                      ? "bi-eye-slash"
                                      : "bi-eye"
                                  }`}
                                ></i>
                              </button>
                            </div>
                          </div>

                          {/* New Password */}
                          <div className="mb-3">
                            <label className="form-label">Yeni Şifre</label>
                            <div className="input-group">
                              <input
                                type={showNewPassword ? "text" : "password"}
                                className="form-control"
                                value={passwordData.newPassword}
                                onChange={(e) =>
                                  setPasswordData({
                                    ...passwordData,
                                    newPassword: e.target.value,
                                  })
                                }
                                placeholder="En az 6 karakter"
                                minLength="6"
                                disabled={passwordLoading}
                                required
                              />
                              <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() =>
                                  setShowNewPassword(!showNewPassword)
                                }
                              >
                                <i
                                  className={`bi ${
                                    showNewPassword ? "bi-eye-slash" : "bi-eye"
                                  }`}
                                ></i>
                              </button>
                            </div>
                          </div>

                          {/* Confirm New Password */}
                          <div className="mb-4">
                            <label className="form-label">
                              Yeni Şifre (Tekrar)
                            </label>
                            <div className="input-group">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="form-control"
                                value={passwordData.confirmPassword}
                                onChange={(e) =>
                                  setPasswordData({
                                    ...passwordData,
                                    confirmPassword: e.target.value,
                                  })
                                }
                                placeholder="Şifreyi tekrar girin"
                                minLength="6"
                                disabled={passwordLoading}
                                required
                              />
                              <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                              >
                                <i
                                  className={`bi ${
                                    showConfirmPassword
                                      ? "bi-eye-slash"
                                      : "bi-eye"
                                  }`}
                                ></i>
                              </button>
                            </div>
                          </div>

                          {/* Submit Button */}
                          <div className="d-grid mb-3">
                            <button
                              type="button"
                              className="btn btn-warning"
                              onClick={handlePasswordChange}
                              disabled={
                                passwordLoading ||
                                !passwordData.currentPassword ||
                                !passwordData.newPassword ||
                                passwordData.newPassword !==
                                  passwordData.confirmPassword
                              }
                            >
                              {passwordLoading ? (
                                <>
                                  <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                  ></span>
                                  Şifre Güncelleniyor...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-check-lg me-2"></i>
                                  Şifreyi Güncelle
                                </>
                              )}
                            </button>
                          </div>

                          {/* Cancel Button */}
                          <div className="d-grid">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                setShowPasswordChange(false);
                                setPasswordData({
                                  currentPassword: "",
                                  newPassword: "",
                                  confirmPassword: "",
                                });
                                setError("");
                                setShowCurrentPassword(false);
                                setShowNewPassword(false);
                                setShowConfirmPassword(false);
                              }}
                              disabled={passwordLoading}
                            >
                              <i className="bi bi-x-lg me-2"></i>
                              İptal Et
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Streak Chart */}
              <div className="col-12 mb-4">
                <div className="card">
                  <div className="card-header bg-warning text-dark">
                    <h5 className="card-title mb-0">
                      <i className="bi bi-fire me-2"></i>
                      Çalışma Serisi
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    {!loading && user && <StreakChart embedded={true} />}
                  </div>
                </div>
              </div>

              {/* TimeChart Integration */}
              <div className="col-12 mb-4">
                <div className="card">
                  <div className="card-header bg-info text-white">
                    <h5 className="card-title mb-0">
                      <i className="bi bi-graph-up me-2"></i>
                      Çalışma İstatistikleri
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    {!loading && user && <TimeChart Toggle={null} />}
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

export default AccountPage;
