import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Alert, Button, Spinner, Container } from "react-bootstrap";
import GoogleButton from "react-google-button";
import { useUserAuth } from "../context/UserAuthContext";
import Nav from "./Nav";

const Login = ({ Toggle }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { logIn, googleSignIn } = useUserAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      await logIn(email, password);
      navigate("/");
    } catch (err) {
      setError("Failed to log in. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await googleSignIn();
      navigate("/");
    } catch (error) {
      setError("Google sign-in failed. " + error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <Nav Toggle={Toggle} />
      <Container
        fluid
        className="px-4 py-5 min-vh-100 d-flex align-items-center justify-content-center"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          position: "relative",
        }}
      >
        {/* Background decorative elements */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "5%",
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            right: "10%",
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            animation: "float 8s ease-in-out infinite reverse",
          }}
        />

        <div
          className="login-card"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: "20px",
            padding: "3rem 2.5rem",
            maxWidth: "450px",
            width: "100%",
            boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Header */}
          <div className="text-center mb-4">
            <h2
              style={{
                fontWeight: "700",
                fontSize: "2.2rem",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: "0.5rem",
              }}
            >
              Welcome Back
            </h2>
            <p style={{ fontSize: "1rem", color: "#6c757d", margin: 0 }}>
              Login to continue your learning journey
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              variant="danger"
              className="text-center"
              style={{
                borderRadius: "12px",
                border: "none",
                background: "rgba(220, 53, 69, 0.1)",
                color: "#dc3545",
                fontSize: "0.9rem",
              }}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Form onSubmit={handleSubmit} className="w-100">
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  color: "#495057",
                  marginBottom: "0.5rem",
                }}
              >
                Email Address
              </Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                style={{
                  padding: "12px 16px",
                  fontSize: "1rem",
                  borderRadius: "12px",
                  border: "2px solid #e9ecef",
                  transition: "all 0.3s ease",
                  background: "#f8f9fa",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#667eea";
                  e.target.style.background = "#fff";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(102, 126, 234, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e9ecef";
                  e.target.style.background = "#f8f9fa";
                  e.target.style.boxShadow = "none";
                }}
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="formPassword">
              <Form.Label
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  color: "#495057",
                  marginBottom: "0.5rem",
                }}
              >
                Password
              </Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{
                  padding: "12px 16px",
                  fontSize: "1rem",
                  borderRadius: "12px",
                  border: "2px solid #e9ecef",
                  transition: "all 0.3s ease",
                  background: "#f8f9fa",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#667eea";
                  e.target.style.background = "#fff";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(102, 126, 234, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e9ecef";
                  e.target.style.background = "#f8f9fa";
                  e.target.style.boxShadow = "none";
                }}
              />
            </Form.Group>

            {/* Login Button */}
            <div className="d-grid mb-3">
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                style={{
                  fontSize: "1rem",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 8px 25px rgba(102, 126, 234, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
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
                    Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </Button>
            </div>
          </Form>

          {/* Divider */}
          <div className="position-relative text-center my-4">
            <hr
              style={{ border: "none", height: "1px", background: "#dee2e6" }}
            />
            <span
              style={{
                position: "absolute",
                top: "-12px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(255, 255, 255, 0.95)",
                padding: "0 1rem",
                fontSize: "0.85rem",
                color: "#6c757d",
                fontWeight: "500",
              }}
            >
              or
            </span>
          </div>

          {/* Google Sign In */}
          <div className="d-flex justify-content-center">
            <div style={{ width: "100%" }}>
              <GoogleButton
                className="g-btn"
                type="dark"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  fontWeight: "500",
                  transition: "all 0.3s ease",
                  opacity: googleLoading ? 0.7 : 1,
                }}
              />
              {googleLoading && (
                <div className="text-center mt-2">
                  <Spinner animation="border" size="sm" />
                </div>
              )}
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-4">
            <span style={{ fontSize: "0.95rem", color: "#6c757d" }}>
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  textDecoration: "none",
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.target.style.textDecoration = "none";
                }}
              >
                Sign up
              </Link>
            </span>
          </div>
        </div>

        {/* CSS Animations */}
        <style>
          {`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-20px); }
            }
            
            .login-card {
              animation: slideUp 0.6s ease-out;
            }
            
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            @media (max-width: 576px) {
              .login-card {
                margin: 1rem;
                padding: 2rem 1.5rem;
              }
            }
          `}
        </style>
      </Container>
    </>
  );
};

export default Login;
