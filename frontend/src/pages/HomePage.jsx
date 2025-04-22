import React from 'react';
import Layout from '../components/Layout';
import BirthdayTimeline from '../components/BirthdayTimeline';
import FamilyTree from '../components/FamilyTree';
import AdminLogin from '../components/AdminLogin';
import SubscriptionForm from '../components/SubscriptionForm';

// Placeholder components for sections - will be created later

const HomePage = () => {
  return (
    <Layout>
      <div className="home-page-grid">
        <BirthdayTimeline />
        <FamilyTree />
        <AdminLogin />
        <SubscriptionForm />
      </div>
    </Layout>
  );
};

export default HomePage;