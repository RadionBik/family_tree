import React, { useState } from 'react'; // Import useState
import Layout from '../components/Layout';
import BirthdayTimeline from '../components/BirthdayTimeline';
import FamilyTree from '../components/FamilyTree';
// import AdminLogin from '../components/AdminLogin'; // Removed import
import SubscriptionForm from '../components/SubscriptionForm';

// Placeholder components for sections - will be created later

const HomePage = () => {
  // State to track the ID of the member selected in the timeline or graph
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  return (
    <Layout>
      <div className="home-page-grid">
        {/* Pass the setter function to BirthdayTimeline */}
        <BirthdayTimeline onMemberSelect={setSelectedMemberId} />
        {/* Pass the selected ID to FamilyTree */}
        <FamilyTree selectedMemberId={selectedMemberId} onMemberSelect={setSelectedMemberId} />
        {/* <AdminLogin /> Removed rendering */}
        <SubscriptionForm />
      </div>
    </Layout>
  );
};

export default HomePage;