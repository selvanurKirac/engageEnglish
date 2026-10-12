import React from "react";
import "../assets/css/style.css";
import { Link, useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";

function Sidebar() {
  const { user, logOut } = useUserAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logOut();
      navigate("/login"); // Çıkış sonrası yönlendirme
    } catch (error) {
      console.error("Çıkış yapılırken hata:", error);
    }
  };

  return (
    <div className="bg-white sidebar p-2">
      <div className="m-2 d-flex align-items-center gap-2">
        <img
          src="/logo.png"
          alt="Logo"
          className="img-fluid rounded"
          style={{
            width: "40px",
            height: "40px",
            objectFit: "contain",
            backgroundColor: "#fff",
            padding: "5px",
          }}
        />
        <span className="brand-name fs-6 fw-bold">Engageenglish</span>
      </div>

      <hr className="text-dark" />
      <div className="list-group list-group-flush">
        <Link className="list-group-item py-2" to="/">
          <i className="bi bi-house fs-5 me-3"></i>
          <span>Home</span>
        </Link>

        <Link className="list-group-item py-2" to="/vocabulary">
          <i className="bi bi-journal-bookmark fs-5 me-3"></i>
          <span>Vocabulary</span>
        </Link>
        <Link className="list-group-item py-2" to="/vocabularycontrol">
          <i className="bi bi-patch-question fs-5 me-3"></i>
          <span>Vocabulary Test</span>
        </Link>

        <Link className="list-group-item py-2" to="/game">
          <i className="bi bi-controller fs-5 me-3"></i> <span>Game</span>
        </Link>

        <Link className="list-group-item py-2" to="/leveltest">
          <i className="bi bi-pencil-square fs-5 me-3"></i>
          <span>Level Test</span>
        </Link>

        <Link className="list-group-item py-2" to="/business-english">
          <i className="bi bi-briefcase fs-5 me-3"></i>
          <span>İş İngilizcesi</span>
        </Link>

        {user && (
          <>
            <Link className="list-group-item py-2" to="/account">
              <i className="bi bi-person-circle fs-5 me-3"></i>
              <span>Hesabım</span>
            </Link>
            <button
              onClick={handleLogout}
              className="list-group-item py-2 border-0 bg-transparent text-start"
            >
              <i className="bi bi-power fs-5 me-3"></i>
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
