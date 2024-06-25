import React, { useState, useEffect } from "react";
import { Fab, Typography } from "@mui/material";
import XIcon from "@mui/icons-material/X";

const TwitterButton = () => {
  return (
    <Fab
      href="https://x.com/ofc_the_club"
      size="small"
      variant="extended"
      sx={{
        padding: "20px",
        backgroundColor: "black",
        color: "white",
        opacity: "0.6",
        position: "fixed",
        bottom: "2rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: (theme) => theme.zIndex.drawer + 2,
        "&:hover": {
          backgroundColor: "black",
          color: "white",
          opacity: "1",
        },
        textTransform: "none",
      }}
    >
      <Typography style={{ fontSize: "1rem", color: "white" }}>
        Follow
      </Typography>
      <XIcon style={{ fontSize: "1.5rem" }} sx={{ ml: 1 }} />
    </Fab>
  );
};

export default TwitterButton;
