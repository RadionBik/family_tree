import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import birthdayService from "../services/birthdayService";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";

const formatRussianDate = (isoDateString) => {
  if (!isoDateString) return "";
  const date = new Date(isoDateString);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(date);
};

const calculateUpcomingAge = (dateOfBirth, nextBirthdayDate) => {
  if (!dateOfBirth || !nextBirthdayDate) return "?";
  const birthYear = new Date(dateOfBirth).getFullYear();
  const nextBirthdayYear = new Date(nextBirthdayDate).getFullYear();
  return nextBirthdayYear - birthYear;
};

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
        const response = await birthdayService.getUpcomingBirthdays();
        setBirthdays(response.data || []);
      } catch (err) {
        console.error("Error fetching birthdays:", err);
        setError(t("birthdayTimeline.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchBirthdays();
  }, [t]);

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }
    if (birthdays.length > 0) {
      return (
        <List dense>
          {" "}
          {birthdays.map((birthday) => {
            const upcomingAge = calculateUpcomingAge(
              birthday.birth_date,
              birthday.next_birthday_date,
            );
            const formattedDate = formatRussianDate(
              birthday.next_birthday_date,
            );
            const handleNameClick = () => {
              if (onMemberSelect) {
                onMemberSelect(birthday.member_id);
              }
            };

            return (
              <ListItem key={birthday.member_id} disablePadding>
                <ListItemText
                  primary={
                    <Tooltip
                      title={t("birthdayTimeline.clickToHighlight")}
                      placement="top"
                    >
                      <Link
                        component="button"
                        variant="body1"
                        onClick={handleNameClick}
                        sx={{
                          cursor: "pointer",
                          textAlign: "left",
                          p: 0,
                          fontWeight: "bold",
                        }}
                      >
                        {birthday.name}
                      </Link>
                    </Tooltip>
                  }
                  secondary={`${formattedDate} (${t("birthdayTimeline.turnsAge", { age: upcomingAge })})`}
                />
              </ListItem>
            );
          })}
        </List>
      );
    }
    return (
      <Typography sx={{ mt: 2 }}>
        {t("birthdayTimeline.noBirthdays")}
      </Typography>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        {t("birthdayTimeline.title")}
      </Typography>
      {renderContent()}
    </Paper>
  );
};

export default BirthdayTimeline;
