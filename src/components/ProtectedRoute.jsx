import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUserAuth();
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setShowAlert(true);
      // scroll engelle
      document.body.style.overflow = "hidden";
    } else {
      // scroll'u eski haline getir
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [loading, user]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100">
        <div className="spinner-border text-primary" role="status" />
        <div className="mt-2">Oturum kontrol ediliyor...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {showAlert && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center bg-primary text-dark text-center"
            style={{ zIndex: 9999 }} // her şeyin üstüne çıkar
          >
            <h2 className="fw-bold mb-3">
              Bu sayfayı görüntülemek için giriş yapmalısınız.
            </h2>
            <button
              className="btn btn-dark px-4 py-2"
              onClick={() => navigate("/login")}
            >
              Giriş Sayfasına Git
            </button>
          </div>
        )}
      </>
    );
  }

  return children;
};

export default ProtectedRoute;
