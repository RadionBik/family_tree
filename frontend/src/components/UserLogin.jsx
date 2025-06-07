import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import authService from "../services/authService";
const UserLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const loginData = await authService.login(username, password);

      if (loginData.access_token) {
        localStorage.setItem("adminToken", loginData.access_token);
        setMessage({
          type: "success",
          text: t(
            "userLogin.successMessage",
            "Login Successful! Redirecting...",
          ),
        });
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        throw new Error(
          t(
            "userLogin.errorTokenMissing",
            "Login successful, but no token received.",
          ),
        );
      }
    } catch (error) {
      let errorMessage = t(
        "userLogin.errorGeneric",
        "Login failed. Please check your credentials and try again.",
      );
      if (error.response) {
        errorMessage = error.response.data?.detail || errorMessage;
        if (error.response.status === 401) {
          errorMessage =
            error.response.data?.detail ||
            t("userLogin.errorInvalid", "Invalid username or password.");
        }
      } else if (error.request) {
        errorMessage = t(
          "userLogin.errorNetwork",
          "Network error. Please check your connection.",
        );
      } else if (error.message && error.message.includes("token received")) {
        errorMessage = error.message;
      }
      console.error(
        "User Login Error:",
        error.response || error.message || error,
      );
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
      if (message.type !== "success") {
        setTimeout(() => {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }, 0);
      }
    }
  };

  return (
    <section
      className="user-login"
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>{t("userLogin.title", "Login to View Site")}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: "15px" }}>
          <label
            htmlFor="user-username"
            style={{ display: "block", marginBottom: "5px" }}
          >
            {t("userLogin.usernameLabel", "Username")}
          </label>
          <input
            type="text"
            id="user-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: "15px" }}>
          <label
            htmlFor="user-password"
            style={{ display: "block", marginBottom: "5px" }}
          >
            {t("userLogin.passwordLabel", "Password")}
          </label>
          <input
            type="password"
            id="user-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>
        {message.text && (
          <div
            className={`message ${message.type === "success" ? "message-success" : "message-error"}`}
            style={{
              padding: "10px",
              marginBottom: "15px",
              border: `1px solid ${message.type === "success" ? "green" : "red"}`,
              color: message.type === "success" ? "green" : "red",
            }}
          >
            {message.text}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {loading
            ? t("userLogin.loggingInButton", "Logging in...")
            : t("userLogin.loginButton", "Login")}
        </button>
      </form>
    </section>
  );
};

export default UserLogin;
