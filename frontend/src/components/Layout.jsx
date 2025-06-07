import React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Header />
      <Container
        component="main"
        maxWidth="lg"
        sx={{
          flexGrow: 1,
          py: 2,
          mt: 2,
          mb: 2,
        }}
      >
        {children}
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout;
