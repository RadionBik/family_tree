import React, { useState } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Layout from "../components/Layout";
import BirthdayTimeline from "../components/BirthdayTimeline";
import FamilyTree from "../components/FamilyTree";
import SubscriptionForm from "../components/SubscriptionForm";

const HomePage = () => {
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  return (
    <Layout>
      <Container maxWidth="lg">
        <BirthdayTimeline onMemberSelect={setSelectedMemberId} />
      </Container>
      <Box sx={{ px: 2 }}>
        <FamilyTree
          selectedMemberId={selectedMemberId}
          onMemberSelect={setSelectedMemberId}
        />
      </Box>
      <Container maxWidth="lg">
        <SubscriptionForm />
      </Container>
    </Layout>
  );
};

export default HomePage;
