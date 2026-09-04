import React from "react";
import Box from "@mui/material/Box";
import Header from "./Header";
import Footer from "./Footer";

// Sections pick their own width: the tree runs edge to edge, lists sit in a Container.
const Layout = ({ children }) => (
  <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
    <Header />
    <Box component="main" sx={{ flexGrow: 1, py: 2 }}>
      {children}
    </Box>
    <Footer />
  </Box>
);

export default Layout;
