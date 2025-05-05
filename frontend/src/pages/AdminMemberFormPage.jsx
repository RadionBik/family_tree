import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import familyTreeService from '../services/familyTreeService'; // Import the service
import RelationshipManager from '../components/RelationshipManager'; // Import the new component

const AdminMemberFormPage = () => {
  const { t } = useTranslation();
  const { id } = useParams(); // Get member ID from URL for editing
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '', // Отчество
    birthDate: '',
    deathDate: '',
    gender: '', // пол
    location: '', // местоположение
    bio: '', // биография
    // Add other fields as needed (e.g., photos)
  });
  const [loading, setLoading] = useState(false); // General loading state (form submit, initial fetch)
  const [message, setMessage] = useState({ type: '', text: '' });
  // State for relationship data
  const [relationshipsFrom, setRelationshipsFrom] = useState([]);
  const [relationshipsTo, setRelationshipsTo] = useState([]);

  // Helper function to parse name from backend (assuming "LastName FirstName MiddleName")
  const parseName = (fullName) => {
    if (!fullName) return { firstName: '', lastName: '', middleName: '' };
    const parts = fullName.split(' ');
    const lastName = parts[0] || '';
    const firstName = parts[1] || '';
    const middleName = parts.slice(2).join(' ') || '';
    return { firstName, lastName, middleName };
  };


  // Function to fetch member data (used in useEffect and after relationship change)
  const fetchMemberData = (memberId) => {
    // Renamed id parameter to memberId to avoid conflict with useParams id
    if (!memberId) return; // Only fetch if editing

    setLoading(true);
    setMessage({ type: '', text: '' }); // Clear previous messages
    familyTreeService.getMemberByIdAdmin(memberId)
      .then(data => {
        // Map API data (backend names) to form state (frontend names)
        const { firstName, lastName, middleName } = parseName(data.name);
        setFormData({
            firstName: firstName,
            lastName: lastName,
            middleName: middleName,
            birthDate: data.birth_date || '', // Handle null dates
            deathDate: data.death_date || '', // Handle null dates
            gender: data.gender || '',
            location: data.location || '',
          bio: data.notes || '', // Map notes to bio
        });
        // Store relationship data
        setRelationshipsFrom(data.relationships_from || []);
        setRelationshipsTo(data.relationships_to || []);
      })
      .catch(err => {
          console.error(`Error fetching member ${memberId}:`, err);
          setMessage({ type: 'error', text: err.response?.data?.detail || t('adminMemberForm.errorFetch', 'Failed to load member data.') }); // Add error key
        })
        .finally(() => {
          setLoading(false);
        });
    // REMOVED the incorrect else block from here
  };


  useEffect(() => {
    if (isEditing) {
      fetchMemberData(id); // Pass the id from useParams
    } else {
       // Reset form and relationships for adding new member
       setFormData({
         firstName: '', lastName: '', middleName: '', birthDate: '', deathDate: '', gender: '', location: '', bio: '',
       });
       setRelationshipsFrom([]);
       setRelationshipsTo([]);
       // Ensure loading is false when resetting for 'add new'
       setLoading(false);
       setMessage({ type: '', text: '' }); // Clear any previous messages
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]); // Only re-run fetch/reset when ID or editing status changes

  // Callback for RelationshipManager to trigger data refresh
  const handleRelationshipChange = (action, status) => {
    console.log(`Relationship action: ${action}, Status: ${status}`);
    if (status === 'success') {
      // Re-fetch the member data to get updated relationships
      fetchMemberData(id); // Pass the id from useParams
    }
    // Message display is handled within RelationshipManager or here if needed
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let response;
      if (isEditing) {
        response = await familyTreeService.updateMemberAdmin(id, formData);
        setMessage({ type: 'success', text: t('adminMemberForm.updateSuccess', 'Member updated successfully!') });
      } else {
        response = await familyTreeService.createMemberAdmin(formData);
        setMessage({ type: 'success', text: t('adminMemberForm.addSuccess', 'Member added successfully!') });
      }
      console.log("API Response:", response); // Log response for debugging
      // Redirect back to list after a short delay
      setTimeout(() => navigate('/admin/members'), 1500);

    } catch (err) {
      console.error("Error saving member:", err);
      // Display specific error from backend if available
      const errorMessage = err.response?.data?.detail || t('adminMemberForm.errorGeneric', 'Failed to save member. Please try again.');
      setMessage({ type: 'error', text: errorMessage });
      setLoading(false); // Keep form enabled on error
    }
    // No finally setLoading(false) here because we redirect on success or keep form enabled on error
  };

  // Show loading indicator only when fetching data for editing
  if (loading && isEditing) {
    return <div>{t('adminMemberForm.loadingData', 'Loading member data...')}</div>;
  }

  return (
    <div>
      <h2>{isEditing ? t('adminMemberForm.editTitle', 'Edit Family Member') : t('adminMemberForm.addTitle', 'Add New Family Member')}</h2>
      <form onSubmit={handleSubmit}>
        {/* Basic Fields */}
        <div className="form-group">
          <label htmlFor="lastName">{t('adminMemberForm.lastNameLabel', 'Фамилия')}</label>
          <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required disabled={loading} title={t('adminMemberForm.lastNameTooltip', 'Введите фамилию члена семьи')} autoComplete="family-name" />
        </div>
        <div className="form-group">
          <label htmlFor="firstName">{t('adminMemberForm.firstNameLabel', 'Имя')}</label>
          <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required disabled={loading} title={t('adminMemberForm.firstNameTooltip', 'Введите имя члена семьи')} autoComplete="given-name" />
        </div>
        <div className="form-group">
          <label htmlFor="middleName">{t('adminMemberForm.middleNameLabel', 'Отчество')}</label>
          <input type="text" id="middleName" name="middleName" value={formData.middleName} onChange={handleChange} disabled={loading} title={t('adminMemberForm.middleNameTooltip', 'Введите отчество (если есть)')} autoComplete="additional-name" />
        </div>
        <div className="form-group">
          <label htmlFor="gender">{t('adminMemberForm.genderLabel', 'Пол')}</label>
          <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required disabled={loading} title={t('adminMemberForm.genderTooltip', 'Выберите пол члена семьи')} autoComplete="sex">
            <option value="">{t('adminMemberForm.selectGender', '-- Выберите пол --')}</option>
            <option value="male">{t('adminMemberForm.genderMale', 'Мужской')}</option>
            <option value="female">{t('adminMemberForm.genderFemale', 'Женский')}</option>
            <option value="other">{t('adminMemberForm.genderOther', 'Другой')}</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="birthDate">{t('adminMemberForm.birthDateLabel', 'Дата рождения')}</label>
          <input type="date" id="birthDate" name="birthDate" value={formData.birthDate} onChange={handleChange} required disabled={loading} title={t('adminMemberForm.birthDateTooltip', 'Выберите дату рождения')} autoComplete="bday" />
        </div>
        <div className="form-group">
          <label htmlFor="deathDate">{t('adminMemberForm.deathDateLabel', 'Дата смерти (если применимо)')}</label>
          <input type="date" id="deathDate" name="deathDate" value={formData.deathDate} onChange={handleChange} disabled={loading} title={t('adminMemberForm.deathDateTooltip', 'Выберите дату смерти, если применимо')} />
        </div>
        <div className="form-group">
          <label htmlFor="location">{t('adminMemberForm.locationLabel', 'Местоположение (город/страна)')}</label>
          <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} disabled={loading} title={t('adminMemberForm.locationTooltip', 'Укажите город или страну проживания/рождения')} autoComplete="address-level2" />
        </div>
        <div className="form-group">
          <label htmlFor="bio">{t('adminMemberForm.bioLabel', 'Биография')}</label>
          <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows="4" disabled={loading} title={t('adminMemberForm.bioTooltip', 'Введите краткую биографию или заметки')}></textarea>
        </div>

        {/* TODO: Add fields for photos, etc. */}

        {message.text && (
          <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
            {message.text}
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? t('adminMemberForm.savingButton', 'Сохранение...') : (isEditing ? t('adminMemberForm.updateButton', 'Обновить') : t('adminMemberForm.addButton', 'Добавить'))}
        </button>
        <button type="button" onClick={() => navigate('/admin/members')} disabled={loading} style={{ marginLeft: '1rem', backgroundColor: '#6c757d' }}>
          {t('adminMemberForm.cancelButton', 'Отмена')}
        </button>
      </form>

      {/* Conditionally render Relationship Manager only when editing */}
      {isEditing && id && (
        <RelationshipManager
          memberId={parseInt(id, 10)} // Ensure ID is a number
          relationshipsFrom={relationshipsFrom}
          relationshipsTo={relationshipsTo}
          onRelationshipChange={handleRelationshipChange}
        />
      )}
    </div>
  );
};

export default AdminMemberFormPage;