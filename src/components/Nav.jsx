import React from "react";
import "bootstrap/js/dist/dropdown";
import "bootstrap/js/dist/collapse";
import { useUserAuth } from "../context/UserAuthContext";

function Nav({ Toggle }) {
  const { user } = useUserAuth();

  return (
    <nav className="navbar navbar-expand-sm shadow-sm px-3">
      <i
        className="bi bi-list fs-3 text-dark me-3"
        style={{ cursor: "pointer" }}
        onClick={Toggle}
      ></i>

      <button
        className="navbar-toggler d-lg-none"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#collapsibleNavId"
        aria-controls="collapsibleNavId"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <i className="bi bi-justify text-dark"></i>
      </button>

      <div className="collapse navbar-collapse" id="collapsibleNavId">
        <ul className="navbar-nav ms-auto mt-2 mt-lg-0">
          {!user ? (
            <>
              <li className="nav-item">
                <a className="nav-link text-dark fw-semibold" href="/login">
                  Login
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-dark fw-semibold" href="/register">
                  Register
                </a>
              </li>
            </>
          ) : (
            <li className="nav-item">
              <span className="nav-link text-dark fw-semibold">
                {user.email}
              </span>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Nav;
