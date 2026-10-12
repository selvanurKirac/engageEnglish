import React, { useState } from "react";
import { auth } from "../../config/firebase";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Button, Form } from "react-bootstrap";
import Nav from "../../components/Nav";

const ChangePassword = ({ Toggle }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");

    const user = auth.currentUser;

    if (!user || !user.email) {
      setMessage("⚠️ Kullanıcı oturumu bulunamadı.");
      return;
    }

    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    try {
      await reauthenticateWithCredential(user, credential);

      if (newPassword !== confirmPassword) {
        setMessage("❌ Yeni şifreler uyuşmuyor.");
        return;
      }

      await updatePassword(user, newPassword);
      setMessage("✅ Şifre başarıyla güncellendi.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        setMessage("❌ Mevcut şifreniz yanlış.");
      } else {
        setMessage("⚠️ Hata oluştu: " + error.message);
      }
    }
  };

  const togglePasswordVisibility = (type) => {
    if (type === "current") {
      setShowCurrentPassword(!showCurrentPassword);
    } else if (type === "new") {
      setShowNewPassword(!showNewPassword);
    } else if (type === "confirm") {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="container-fluid mt-3">
      <Nav Toggle={Toggle} /> {/* Üstte Nav olacak */}
      <div className="mt-5">
        <h2 className="text-center mb-4">🔐 Şifre Değiştir</h2>
        {message && (
          <div className="alert alert-info text-center" role="alert">
            {message}
          </div>
        )}
        <form onSubmit={handleChangePassword} className="w-100">
          <div className="row mb-3">
            <div className="col-md-4 offset-md-4">
              <label className="form-label">Mevcut Şifre</label>
              <div className="input-group">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="form-control"
                  required
                />
                <Button
                  variant="outline-secondary"
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                >
                  {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </div>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-4 offset-md-4">
              <label className="form-label">Yeni Şifre</label>
              <div className="input-group">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-control"
                  required
                />
                <Button
                  variant="outline-secondary"
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-4 offset-md-4">
              <label className="form-label">Yeni Şifre (Tekrar)</label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-control"
                  required
                />
                <Button
                  variant="outline-secondary"
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-4 offset-md-4 d-grid">
              <Button variant="primary" type="submit">
                Şifreyi Güncelle
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
