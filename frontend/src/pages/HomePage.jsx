import React, { useState } from "react";
import Layout from "../components/Layout";
import BirthdayTimeline from "../components/BirthdayTimeline";
import FamilyTree from "../components/FamilyTree";
import SubscriptionForm from "../components/SubscriptionForm";

const HomePage = () => {
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  return (
    <Layout>
      <div className="home-page-grid">
        <BirthdayTimeline onMemberSelect={setSelectedMemberId} />
        <FamilyTree
          selectedMemberId={selectedMemberId}
          onMemberSelect={setSelectedMemberId}
        />
        <SubscriptionForm />
      </div>
    </Layout>
  );
};

export default HomePage;
