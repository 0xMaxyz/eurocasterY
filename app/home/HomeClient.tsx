"use client";

import { SyntheticEvent, useEffect, useState } from "react";
import {
  Container,
  Tabs,
  Tab,
  Box,
  createTheme,
  Backdrop,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import Matches from "@/components/Matches";
import Leaderboard from "@/components/Leaderboard";
import TaC from "@/components/Tac";
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import LoginWrapper from "./DynamicWidgetWrapper";
import ScrollToTop from "@/components/ScrollToTop";
import { useRouter, useSearchParams } from "next/navigation";
const theme = createTheme({
  palette: {
    mode: "light",
  },
});

const HomeClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabQuery || "matches");
  useEffect(() => {
    if (tabQuery !== activeTab) {
      setActiveTab(tabQuery || "matches");
    }
  }, [tabQuery]);

  const { user, isAuthenticated } = useDynamicContext();

  const handleChange = (
    event: SyntheticEvent<Element, Event>,
    newValue: string
  ) => {
    setActiveTab(newValue);
    //router.push(`/?tab=${newValue}`); TODO
  };

  const CustomInnerButton = () => {
    return (
      <span className="typography typography--button-primary typography--primary">
        Log in
      </span>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" style={{ padding: "0px" }}>
        <ScrollToTop />
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          p={2}
        >
          <img height={"25px"} src="/eurocaster_assets/logo.png" />
          <LoginWrapper />
        </Box>

        <Tabs
          value={activeTab}
          onChange={handleChange}
          indicatorColor="primary"
          scrollButtons="auto"
          TabIndicatorProps={{
            style: {
              display: "none",
            },
          }}
        >
          <Tab
            label="Matches"
            value="matches"
            sx={{
              minHeight: "2rem",
              height: "2rem",
              marginRight: "0.5rem",
              marginLeft: "1rem",
              borderRadius: activeTab === "matches" ? "2rem" : "0%",
              border: activeTab === "matches" ? "2px solid black" : "none",
              padding: "0.5rem",
              "&.Mui-selected": {
                color: "black",
                backgroundColor: "inherit",
              },
            }}
          />
          <Tab
            label="Leaderboard"
            value="leaderboard"
            sx={{
              minHeight: "2rem",
              height: "2rem",
              marginRight: "0.5rem",
              borderRadius: activeTab === "leaderboard" ? "2rem" : "0%",
              border: activeTab === "leaderboard" ? "2px solid black" : "none",
              padding: "0.5rem",
              "&.Mui-selected": {
                color: "black",
                backgroundColor: "inherit",
              },
            }}
          />
          <Tab
            label="T&C"
            value="toc"
            sx={{
              minWidth: "1.2rem",
              minHeight: "2rem",
              height: "2rem",
              marginRight: "0.5rem",
              borderRadius: activeTab === "toc" ? "2rem" : "0%",
              border: activeTab === "toc" ? "2px solid black" : "none",
              padding: "0.5rem",
              "&.Mui-selected": {
                color: "black",
                backgroundColor: "inherit",
              },
            }}
          />
        </Tabs>
        <Box>
          <img src="/eurocaster_assets/banners/0.png" width={"100%"} />
        </Box>

        <Box>
          {activeTab === "matches" && (
            <Box position="relative">
              <Backdrop
                open={!isAuthenticated}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  color: "#fff",
                  zIndex: !isAuthenticated
                    ? (theme) => theme.zIndex.drawer + 1
                    : -1,
                  backgroundColor: "rgba(255, 255, 255, 0.2)", // Semi-transparent background
                  backdropFilter: "blur(5px)",
                  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                }}
              >
                <Box
                  position={"absolute"}
                  top={10}
                  display={"flex"}
                  flexDirection={"column"}
                  alignContent={"center"}
                  alignItems={"center"}
                >
                  <h2 style={{ color: "black" }}>
                    Login to predict the matches
                  </h2>
                  <DynamicWidget innerButtonComponent={<CustomInnerButton />} />
                </Box>
              </Backdrop>
              <Matches />
            </Box>
          )}
          {activeTab === "leaderboard" && <Leaderboard />}
          {activeTab === "toc" && <TaC />}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default HomeClient;
