import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Layout from "../components/Layout";
import BirthdayTimeline from "../components/BirthdayTimeline";
import FamilyTree from "../components/FamilyTree";
import ChangeLog from "../components/ChangeLog";
import SubscriptionForm from "../components/SubscriptionForm";
import familyTreeService from "../services/familyTreeService";
import { pickRoot } from "../utils/chartData";

const HomePage = () => {
  const { t } = useTranslation();
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [focusId, setFocusId] = useState(null); // tree center; null = default root
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0); // bumps after every edit

  const reload = useCallback(async () => {
    try {
      const data = await familyTreeService.getFamilyTreeData();
      if (!Array.isArray(data)) throw new Error("bad payload");
      setMembers(data);
      setSelectedMemberId(
        (cur) => cur ?? (data.length ? pickRoot(data).id : null),
      );
      setError(null);
      setVersion((v) => v + 1);
    } catch {
      setError(t("familyTree.errorLoading"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // Data fetch on mount; state updates happen after the await, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  return (
    <Layout>
      <Container maxWidth="lg">
        <BirthdayTimeline onMemberSelect={setSelectedMemberId} />
      </Container>
      <Box sx={{ px: 2 }}>
        <FamilyTree
          members={members}
          loading={loading}
          error={error}
          selectedMemberId={selectedMemberId}
          onMemberSelect={setSelectedMemberId}
          focusId={focusId}
          onFocus={setFocusId}
          onChanged={reload}
        />
      </Box>
      <Container maxWidth="lg">
        <ChangeLog version={version} onMemberSelect={setSelectedMemberId} />
        <SubscriptionForm />
      </Container>
    </Layout>
  );
};

export default HomePage;
