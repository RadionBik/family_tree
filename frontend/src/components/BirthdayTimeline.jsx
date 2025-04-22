import React from 'react';
import { useTranslation } from 'react-i18next';

// Placeholder data (Consider moving or fetching this later)
const placeholderBirthdays = [
  { id: 1, name: 'Иван Петров', date: '25 апреля', age: 30 }, // Example data, keep for now
  { id: 2, name: 'Мария Сидорова', date: '1 мая', age: 25 },
  { id: 3, name: 'Алексей Иванов', date: '15 мая', age: 42 },
];

const BirthdayTimeline = () => {
  const { t } = useTranslation();

  return (
    <section className="birthday-timeline">
      <h2>{t('birthdayTimeline.title')}</h2>
      {placeholderBirthdays.length > 0 ? (
        <ul>
          {placeholderBirthdays.map(birthday => (
            <li key={birthday.id}>
              <strong>{birthday.name}</strong> - {birthday.date} ({t('birthdayTimeline.turnsAge', { age: birthday.age })})
            </li>
          ))}
        </ul>
      ) : (
        <p>{t('birthdayTimeline.noBirthdays')}</p>
      )}
      {/* Add loading state later */}
    </section>
  );
};

export default BirthdayTimeline;