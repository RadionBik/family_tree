import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import birthdayService from '../services/birthdayService';

// Helper function to format date in Russian (e.g., "25 апреля")
const formatRussianDate = (isoDateString) => {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(date);
};

// Helper function to calculate upcoming age
const calculateUpcomingAge = (dateOfBirth, nextBirthdayDate) => {
  if (!dateOfBirth || !nextBirthdayDate) return '?';
  const birthYear = new Date(dateOfBirth).getFullYear();
  const nextBirthdayYear = new Date(nextBirthdayDate).getFullYear();
  return nextBirthdayYear - birthYear;
};


// Accept onMemberSelect prop to notify parent of selection
const BirthdayTimeline = ({ onMemberSelect }) => {
  const { t } = useTranslation();
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch using the default window (90 days) defined in the service
        const response = await birthdayService.getUpcomingBirthdays();
        // Assuming API returns data sorted chronologically and filtered for living members
        setBirthdays(response.data || []);
      } catch (err) {
        console.error("Error fetching birthdays:", err);
        setError(t('birthdayTimeline.error')); // Use translation for error message
      } finally {
        setLoading(false);
      }
    };

    fetchBirthdays();
  }, [t]); // Add t to dependency array if translations change

  return (
    <section className="birthday-timeline">
      <h2>{t('birthdayTimeline.title')}</h2>
      {loading && <p>{t('birthdayTimeline.loading')}</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && birthdays.length > 0 ? (
        <ul>
          {birthdays.map(birthday => {
            // Use correct property names from the API response (birth_date, member_id)
            const upcomingAge = calculateUpcomingAge(birthday.birth_date, birthday.next_birthday_date);
            const formattedDate = formatRussianDate(birthday.next_birthday_date);
            // Handle click on the name
            const handleNameClick = () => {
              if (onMemberSelect) {
                onMemberSelect(birthday.member_id);
              }
            };

            return (
              <li key={birthday.member_id}>
                {/* Make the name clickable */}
                <strong
                  onClick={handleNameClick}
                  style={{ cursor: 'pointer', textDecoration: 'underline' }} // Add basic styling
                  title={t('birthdayTimeline.clickToHighlight')} // Add tooltip
                >
                  {birthday.name}
                </strong> - {formattedDate} ({t('birthdayTimeline.turnsAge', { age: upcomingAge })})
              </li>
            );
          })}
        </ul>
      ) : (
        !loading && !error && <p>{t('birthdayTimeline.noBirthdays')}</p>
      )}
    </section>
  );
};

export default BirthdayTimeline;