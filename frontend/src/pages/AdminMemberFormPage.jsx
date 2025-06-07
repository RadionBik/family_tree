import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import familyTreeService from "../services/familyTreeService";
import RelationshipManager from "../components/RelationshipManager";

const AdminMemberFormPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    birthDate: "",
    deathDate: "",
    gender: "",
    location: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [relationshipsFrom, setRelationshipsFrom] = useState([]);
  const [relationshipsTo, setRelationshipsTo] = useState([]);

  const parseName = (fullName) => {
    if (!fullName) return { firstName: "", lastName: "", middleName: "" };
    const parts = fullName.split(" ");
    const lastName = parts[0] || "";
    const firstName = parts[1] || "";
    const middleName = parts.slice(2).join(" ") || "";
    return { firstName, lastName, middleName };
  };

  const fetchMemberData = (memberId) => {
    if (!memberId) return;

    setLoading(true);
    setMessage({ type: "", text: "" });
    familyTreeService
      .getMemberByIdAdmin(memberId)
      .then((data) => {
        const { firstName, lastName, middleName } = parseName(data.name);
        setFormData({
          firstName: firstName,
          lastName: lastName,
          middleName: middleName,
          birthDate: data.birth_date || "",
          deathDate: data.death_date || "",
          gender: data.gender || "",
          location: data.location || "",
          bio: data.notes || "",
        });
        setRelationshipsFrom(data.relationships_from || []);
        setRelationshipsTo(data.relationships_to || []);
      })
      .catch((err) => {
        console.error(`Error fetching member ${memberId}:`, err);
        setMessage({
          type: "error",
          text:
            err.response?.data?.detail ||
            t("adminMemberForm.errorFetch", "Failed to load member data."),
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isEditing) {
      fetchMemberData(id);
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        middleName: "",
        birthDate: "",
        deathDate: "",
        gender: "",
        location: "",
        bio: "",
      });
      setRelationshipsFrom([]);
      setRelationshipsTo([]);
      setLoading(false);
      setMessage({ type: "", text: "" });
    }
  }, [id, isEditing]);

  const handleRelationshipChange = (action, status) => {
    console.log(`Relationship action: ${action}, Status: ${status}`);
    if (status === "success") {
      fetchMemberData(id);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      let response;
      if (isEditing) {
        response = await familyTreeService.updateMemberAdmin(id, formData);
        setMessage({
          type: "success",
          text: t(
            "adminMemberForm.updateSuccess",
            "Member updated successfully!",
          ),
        });
      } else {
        response = await familyTreeService.createMemberAdmin(formData);
        setMessage({
          type: "success",
          text: t("adminMemberForm.addSuccess", "Member added successfully!"),
        });
      }
      console.log("API Response:", response);
      setTimeout(() => navigate("/admin/members"), 1500);
    } catch (err) {
      console.error("Error saving member:", err);
      const errorMessage =
        err.response?.data?.detail ||
        t(
          "adminMemberForm.errorGeneric",
          "Failed to save member. Please try again.",
        );
      setMessage({ type: "error", text: errorMessage });
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div>{t("adminMemberForm.loadingData", "Loading member data...")}</div>
    );
  }

  return (
    <div>
      <h2>
        {isEditing
          ? t("adminMemberForm.editTitle", "Edit Family Member")
          : t("adminMemberForm.addTitle", "Add New Family Member")}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="lastName">
            {t("adminMemberForm.lastNameLabel", "Фамилия")}
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={loading}
            title={t(
              "adminMemberForm.lastNameTooltip",
              "Введите фамилию члена семьи",
            )}
            autoComplete="family-name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="firstName">
            {t("adminMemberForm.firstNameLabel", "Имя")}
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={loading}
            title={t(
              "adminMemberForm.firstNameTooltip",
              "Введите имя члена семьи",
            )}
            autoComplete="given-name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="middleName">
            {t("adminMemberForm.middleNameLabel", "Отчество")}
          </label>
          <input
            type="text"
            id="middleName"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
            disabled={loading}
            title={t(
              "adminMemberForm.middleNameTooltip",
              "Введите отчество (если есть)",
            )}
            autoComplete="additional-name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="gender">
            {t("adminMemberForm.genderLabel", "Пол")}
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            disabled={loading}
            title={t(
              "adminMemberForm.genderTooltip",
              "Выберите пол члена семьи",
            )}
            autoComplete="sex"
          >
            <option value="">
              {t("adminMemberForm.selectGender", "-- Выберите пол --")}
            </option>
            <option value="male">
              {t("adminMemberForm.genderMale", "Мужской")}
            </option>
            <option value="female">
              {t("adminMemberForm.genderFemale", "Женский")}
            </option>
            <option value="other">
              {t("adminMemberForm.genderOther", "Другой")}
            </option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="birthDate">
            {t("adminMemberForm.birthDateLabel", "Дата рождения")}
          </label>
          <input
            type="date"
            id="birthDate"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            required
            disabled={loading}
            title={t(
              "adminMemberForm.birthDateTooltip",
              "Выберите дату рождения",
            )}
            autoComplete="bday"
          />
        </div>
        <div className="form-group">
          <label htmlFor="deathDate">
            {t(
              "adminMemberForm.deathDateLabel",
              "Дата смерти (если применимо)",
            )}
          </label>
          <input
            type="date"
            id="deathDate"
            name="deathDate"
            value={formData.deathDate}
            onChange={handleChange}
            disabled={loading}
            title={t(
              "adminMemberForm.deathDateTooltip",
              "Выберите дату смерти, если применимо",
            )}
          />
        </div>
        <div className="form-group">
          <label htmlFor="location">
            {t(
              "adminMemberForm.locationLabel",
              "Местоположение (город/страна)",
            )}
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            disabled={loading}
            title={t(
              "adminMemberForm.locationTooltip",
              "Укажите город или страну проживания/рождения",
            )}
            autoComplete="address-level2"
          />
        </div>
        <div className="form-group">
          <label htmlFor="bio">
            {t("adminMemberForm.bioLabel", "Биография")}
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows="4"
            disabled={loading}
            title={t(
              "adminMemberForm.bioTooltip",
              "Введите краткую биографию или заметки",
            )}
          ></textarea>
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
            ? t("adminMemberForm.savingButton", "Сохранение...")
            : isEditing
              ? t("adminMemberForm.updateButton", "Обновить")
              : t("adminMemberForm.addButton", "Добавить")}
        </button>
        <button
          type="button"
          onClick={() => navigate("/admin/members")}
          disabled={loading}
          style={{ marginLeft: "1rem", backgroundColor: "#6c757d" }}
        >
          {t("adminMemberForm.cancelButton", "Отмена")}
        </button>
      </form>

      {isEditing && id && (
        <RelationshipManager
          memberId={parseInt(id, 10)}
          relationshipsFrom={relationshipsFrom}
          relationshipsTo={relationshipsTo}
          onRelationshipChange={handleRelationshipChange}
        />
      )}
    </div>
  );
};

export default AdminMemberFormPage;
