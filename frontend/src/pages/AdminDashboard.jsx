import React from "react";
import { useTranslation } from "react-i18next";

const AdminDashboard = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{t("adminDashboard.title", "Admin Dashboard")}</h2>
      <p>
        {t(
          "adminDashboard.welcome",
          "Welcome to the admin panel. Select an option from the navigation.",
        )}
      </p>
      {/* Dashboard widgets can be added here later */}
    </div>
  );
};

export default AdminDashboard;
