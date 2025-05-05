import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import subscriptionService from "../services/subscriptionService"; // Import the service
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper"; // Use Paper for visual grouping

const SubscriptionForm = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" }); // type: 'success' | 'error'

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const response = await subscriptionService.subscribe(email);
      setMessage({
        type: "success",
        text: response.message || t("subscriptionForm.successDefault"),
      });
      setEmail("");
    } catch (error) {
      let errorMessage = t("subscriptionForm.errorGeneric");
      if (error.response) {
        console.error("Subscription Error Response:", error.response.data);
        errorMessage = error.response.data?.detail || errorMessage;
        if (error.response.status === 409) {
          errorMessage =
            error.response.data?.detail || t("subscriptionForm.errorDuplicate");
        }
      } else if (error.request) {
        console.error("Subscription Error Request:", error.request);
        errorMessage = t("subscriptionForm.errorNetwork");
      } else {
        console.error("Subscription Error Message:", error.message);
      }
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Use Paper for visual container
    <Paper
      elevation={2}
      sx={{ p: 3, mt: 3, mb: 2, maxWidth: "sm", mx: "auto" }}
    >
      <Typography variant="h5" component="h2" gutterBottom align="center">
        {t("subscriptionForm.title")}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label={t("subscriptionForm.emailLabel")}
          name="email"
          autoComplete="email"
          autoFocus
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          error={message.type === "error"} // Highlight field if there was an error related to it (optional)
        />

        {message.text && (
          <Alert severity={message.type || "info"} sx={{ mt: 2, mb: 1 }}>
            {message.text}
          </Alert>
        )}

        <Box sx={{ position: "relative", mt: 3, mb: 2 }}>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
          >
            {loading
              ? t("subscriptionForm.subscribingButton")
              : t("subscriptionForm.subscribeButton")}
          </Button>
          {loading && (
            <CircularProgress
              size={24}
              sx={{
                color: "primary.main", // Or choose a contrast color
                position: "absolute",
                top: "50%",
                left: "50%",
                marginTop: "-12px",
                marginLeft: "-12px",
              }}
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default SubscriptionForm;
