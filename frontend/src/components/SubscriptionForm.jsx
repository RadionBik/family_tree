import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const SubscriptionForm = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    // Placeholder for subscription logic - will connect to API later
    console.log('Subscription Attempt:', { name, email });
    alert(t('subscriptionForm.alertNotImplemented'));
  };

  return (
    <section className="subscription-form">
      <h2>{t('subscriptionForm.title')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">{t('subscriptionForm.nameLabel')}</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">{t('subscriptionForm.emailLabel')}</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">{t('subscriptionForm.subscribeButton')}</button>
      </form>
    </section>
  );
};

export default SubscriptionForm;