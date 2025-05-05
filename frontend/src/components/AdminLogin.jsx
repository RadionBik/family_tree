import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import authService from "../services/authService"; // Import the auth service

const AdminLogin = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      // Call the login function from the auth service
      const loginData = await authService.login(username, password); // loginData contains { access_token, token_type }

      // On successful login:
      setMessage({
        type: "success",
        text: t("adminLogin.successMessage", "Login Successful!"),
      });
      // Call the callback function passed via props, potentially passing token/user info
      if (onLoginSuccess) {
        onLoginSuccess(loginData); // Pass token data back
      }
      // Clear fields after a short delay to show success message
      setTimeout(() => {
        setUsername("");
        setPassword("");
        // Optionally redirect here
      }, 1500);
    } catch (error) {
      let errorMessage = t(
        "adminLogin.errorGeneric",
        "Login failed. Please try again.",
      );
      if (error.response) {
        // Use detail from API error response if available (e.g., invalid credentials)
        errorMessage = error.response.data?.detail || errorMessage;
        // Specific handling for common auth errors (e.g., 401 Unauthorized)
        if (error.response.status === 401) {
          errorMessage =
            error.response.data?.detail ||
            t("adminLogin.errorInvalid", "Invalid username or password."); // Add invalid key
        }
      } else if (error.request) {
        errorMessage = t(
          "adminLogin.errorNetwork",
          "Network error. Please check connection.",
        ); // Add network error key
      }
      console.error(
        "Admin Login Error:",
        error.response || error.message || error,
      );
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-login">
      <h2>{t("adminLogin.title")}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="admin-username">
            {t("adminLogin.usernameLabel")}
          </label>{" "}
          {/* Changed id */}
          <input
            type="text"
            id="admin-username" // Changed id
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="admin-password">
            {t("adminLogin.passwordLabel")}
          </label>{" "}
          {/* Changed id */}
          <input
            type="password"
            id="admin-password" // Changed id
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        {message.text && (
          <div
            className={`message ${message.type === "success" ? "message-success" : "message-error"}`}
          >
            {message.text}
          </div>
        )}
        <button type="submit" disabled={loading}>
          {loading
            ? t("adminLogin.loggingInButton", "Logging in...")
            : t("adminLogin.loginButton")}{" "}
          {/* Add loading button key */}
        </button>
      </form>
    </section>
  );
};

export default AdminLogin;
