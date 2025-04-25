import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import subscriptionService from '../services/subscriptionService'; // Import the service

const SubscriptionForm = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      // Call the subscription service
      const response = await subscriptionService.subscribe(email);
      // Use message from API response, or a default success message
      setMessage({ type: 'success', text: response.message || t('subscriptionForm.successDefault') });
      setEmail(''); // Clear email field on success
    } catch (error) {
      // Handle errors from the API call
      let errorMessage = t('subscriptionForm.errorGeneric'); // Default error message
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Subscription Error Response:", error.response.data);
        // Use detail from API error response if available
        errorMessage = error.response.data?.detail || errorMessage;
        // Specific handling for 409 Conflict (duplicate email)
        if (error.response.status === 409) {
           errorMessage = error.response.data?.detail || t('subscriptionForm.errorDuplicate');
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Subscription Error Request:", error.request);
        errorMessage = t('subscriptionForm.errorNetwork');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Subscription Error Message:', error.message);
      }
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      // Ensure loading state is reset regardless of outcome
      setLoading(false);
    }
  };

  return (
    <section className="subscription-form">
      <h2>{t('subscriptionForm.title')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">{t('subscriptionForm.emailLabel')}</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        {message.text && (
          // Add CSS classes for styling success/error messages
          <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
            {message.text}
          </div>
        )}
        <button type="submit" disabled={loading}>
          {loading ? t('subscriptionForm.subscribingButton') : t('subscriptionForm.subscribeButton')}
        </button>
      </form>
    </section>
  );
};

export default SubscriptionForm;