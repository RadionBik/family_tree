import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import authService from "../services/authService";

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
      const loginData = await authService.login(username, password);

      setMessage({
        type: "success",
        text: t("adminLogin.successMessage", "Login Successful!"),
      });
      if (onLoginSuccess) {
        onLoginSuccess(loginData);
      }
      setTimeout(() => {
        setUsername("");
        setPassword("");
      }, 1500);
    } catch (error) {
      let errorMessage = t(
        "adminLogin.errorGeneric",
        "Login failed. Please try again.",
      );
      if (error.response) {
        errorMessage = error.response.data?.detail || errorMessage;
        if (error.response.status === 401) {
          errorMessage =
            error.response.data?.detail ||
            t("adminLogin.errorInvalid", "Invalid username or password.");
        }
      } else if (error.request) {
        errorMessage = t(
          "adminLogin.errorNetwork",
          "Network error. Please check connection.",
        );
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
          <input
            type="text"
            id="admin-username"
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
          <input
            type="password"
            id="admin-password"
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
        </button>
      </form>
    </section>
  );
};

export default AdminLogin;
