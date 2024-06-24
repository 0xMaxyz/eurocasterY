// components/ScrollToTop.js
import React, { useState, useEffect } from "react";
import { Fab } from "@mui/material";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <div>
      {isVisible && (
        <Fab
          color="primary"
          onClick={scrollToTop}
          sx={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: (theme) => theme.zIndex.drawer + 2,
          }}
        >
          <p style={{ fontSize: "2rem", color: "white" }}>▲</p>
        </Fab>
      )}
    </div>
  );
};

export default ScrollToTop;
