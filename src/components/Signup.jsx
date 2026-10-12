import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Alert, Button, Container, Spinner } from "react-bootstrap";
import { useUserAuth } from "../context/UserAuthContext";
import Nav from "./Nav";

const Signup = ({ Toggle }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUp } = useUserAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email.trim()) {
      setError("Email address is required.");
      return false;
    }

    if (!password.trim()) {
      setError("Password is required.");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password);
      navigate("/");
    } catch (err) {
      setError("Signup failed. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Nav Toggle={Toggle} />
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div className="w-100" style={{ maxWidth: "450px" }}>
          <div className="text-center mb-5">
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "linear-gradient(45deg, #FF6B6B, #4ECDC4)",
                borderRadius: "50%",
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              }}
            >
              <i
                className="bi bi-person-plus"
                style={{ fontSize: "2rem", color: "white" }}
              ></i>
            </div>
            <h2
              style={{
                fontWeight: "600",
                fontSize: "2.5rem",
                color: "white",
                marginBottom: "0.5rem",
                textShadow: "0 2px 10px rgba(0,0,0,0.3)",
              }}
            >
              Create Account
            </h2>
          </div>

          {error && (
            <Alert
              variant="danger"
              className="mb-4 text-center border-0"
              style={{
                borderRadius: "15px",
                backgroundColor: "rgba(248, 215, 218, 0.95)",
                color: "#721c24",
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          <div
            className="p-5 border-0"
            style={{
              borderRadius: "25px",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4" controlId="formBasicEmail">
                <Form.Label
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    color: "#2d3748",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Email Address
                </Form.Label>
                <div style={{ position: "relative" }}>
                  <i
                    className="bi bi-envelope"
                    style={{
                      position: "absolute",
                      left: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#a0aec0",
                      fontSize: "1.2rem",
                      zIndex: 1,
                    }}
                  ></i>
                  <Form.Control
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    style={{
                      padding: "16px 16px 16px 50px",
                      fontSize: "1.1rem",
                      borderRadius: "15px",
                      border: "2px solid #e2e8f0",
                      transition: "all 0.3s ease",
                      backgroundColor: "#f8fafc",
                      fontWeight: "500",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#667eea";
                      e.target.style.backgroundColor = "#ffffff";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(102, 126, 234, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.backgroundColor = "#f8fafc";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4" controlId="formBasicPassword">
                <Form.Label
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    color: "#2d3748",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Password
                </Form.Label>
                <div style={{ position: "relative" }}>
                  <i
                    className="bi bi-lock"
                    style={{
                      position: "absolute",
                      left: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#a0aec0",
                      fontSize: "1.2rem",
                      zIndex: 1,
                    }}
                  ></i>
                  <Form.Control
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    style={{
                      padding: "16px 16px 16px 50px",
                      fontSize: "1.1rem",
                      borderRadius: "15px",
                      border: "2px solid #e2e8f0",
                      transition: "all 0.3s ease",
                      backgroundColor: "#f8fafc",
                      fontWeight: "500",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#667eea";
                      e.target.style.backgroundColor = "#ffffff";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(102, 126, 234, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.backgroundColor = "#f8fafc";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
                <Form.Text
                  style={{
                    color: "#718096",
                    fontSize: "0.9rem",
                    marginTop: "8px",
                    display: "block",
                  }}
                >
                  <i className="bi bi-info-circle me-1"></i>
                  Your password must be at least 6 characters
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-5" controlId="formBasicConfirmPassword">
                <Form.Label
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    color: "#2d3748",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Confirm Password
                </Form.Label>
                <div style={{ position: "relative" }}>
                  <i
                    className="bi bi-lock-fill"
                    style={{
                      position: "absolute",
                      left: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#a0aec0",
                      fontSize: "1.2rem",
                      zIndex: 1,
                    }}
                  ></i>
                  <Form.Control
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    style={{
                      padding: "16px 16px 16px 50px",
                      fontSize: "1.1rem",
                      borderRadius: "15px",
                      border: "2px solid #e2e8f0",
                      transition: "all 0.3s ease",
                      backgroundColor: "#f8fafc",
                      fontWeight: "500",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#667eea";
                      e.target.style.backgroundColor = "#ffffff";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(102, 126, 234, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.backgroundColor = "#f8fafc";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </Form.Group>

              <div className="d-grid mb-4">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  style={{
                    fontSize: "1.2rem",
                    padding: "16px",
                    fontWeight: "700",
                    borderRadius: "15px",
                    border: "none",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    transition: "all 0.3s ease",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow =
                        "0 15px 40px rgba(102, 126, 234, 0.6)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow =
                        "0 10px 30px rgba(102, 126, 234, 0.4)";
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        className="me-2"
                      />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-rocket-takeoff me-2"></i>
                      Sign Up
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </div>

          <div className="text-center mt-4">
            <div
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                padding: "20px",
                borderRadius: "15px",
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <span
                style={{
                  fontSize: "1.1rem",
                  color: "#4a5568",
                  fontWeight: "500",
                }}
              >
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    textDecoration: "none",
                    background: "linear-gradient(135deg, #667eea, #764ba2)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.textShadow =
                      "0 2px 8px rgba(102, 126, 234, 0.3)";
                    e.target.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.textShadow = "none";
                    e.target.style.transform = "scale(1)";
                  }}
                >
                  Sign In →
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
