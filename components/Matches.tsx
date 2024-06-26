import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { MatchAndTeamInfo, predictResponseDto } from "@/lib/data/dtos";
import { dateOptions } from "@/lib/consts";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { checkIfKickoffPassed } from "@/lib/functions";
import styles from "./Matches.module.css";
import { userVoteDto } from "@/lib/data/db";

export type AuthProvider = "twitter" | "farcaster" | null;

interface snackbarState {
  open: boolean;
  hasError: boolean;
  error: string;
}

const Matches = () => {
  const { isAuthenticated, user } = useDynamicContext();
  const [matches, setMatches] = useState<MatchAndTeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<userVoteDto[]>([]);
  const [openSnackbar, setopenSnackbar] = useState<snackbarState>({
    open: false,
    hasError: false,
    error: "",
  });
  const [voteSnackbar, setvoteSnackbar] = useState(false);
  const [updateVotes, setupdateVotes] = useState(false);
  const [user_id, setUser_id] = useState<string | null>("");

  useEffect(() => {
    const fetchMatches = async () => {
      const response = await fetch(`/api/conf/matches`);
      if (response.ok) {
        const data: MatchAndTeamInfo[] = await response.json();
        //console.log(data);
        setMatches(data);
        setLoading(false);
      }
      // TODO Add else
    };
    fetchMatches();
  }, []);

  useEffect(() => {
    setUser_id(getUserId());
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchVotes = async () => {
      const response = await fetch(`/api/conf/votes?user_id=${user_id}`);
      if (response.ok) {
        const data = await response.json();
        console.log("votes received", data);
        setVotes(data);
      } else {
        // TODO: Handle the else case
      }
    };
    if (isAuthenticated && user_id) {
      fetchVotes();
    }
  }, [isAuthenticated, updateVotes, user_id]);

  const getUserId = () => {
    return isAuthenticated && user ? user.userId! : null;
  };

  const vote = async function (
    match_id: number,
    short_country: string | number
  ) {
    setvoteSnackbar(true);
    const req = JSON.stringify({
      user_id: user_id,
      match_id: match_id.toString(),
      prediction: short_country.toString(),
    });
    const response = await fetch(`/api/conf/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: req,
    });
    const data: predictResponseDto = await response.json();
    console.log("Vote Response: ", data);

    if (!data.has_error) {
      setopenSnackbar({
        open: true,
        hasError: false,
        error: "",
      });
      setupdateVotes((prev) => !prev);
    } else {
      setopenSnackbar({
        open: true,
        hasError: true,
        error: data.error_message!,
      });
    }
  };

  const renderSkeleton = (key: string) => (
    <Box
      className="parentBox"
      key={key}
      sx={{
        position: "relative",
        marginBottom: "0",
        borderRadius: "0px",
        borderTop: "1px solid #DCDCDC",
        borderBottom: "1px solid #DCDCDC",
        borderLeft: "none",
        borderRight: "none",
        paddingRight: ["0.725rem", "1rem"],
        paddingLeft: ["0.725rem", "1rem"],
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{ padding: "0px", flex: "1 0 auto" }}
      >
        <Skeleton
          variant="circular"
          width={50}
          height={50}
          className={styles.imageAvatar}
        />
        <Stack
          direction="column"
          justifyContent={"end"}
          alignItems="center"
          sx={{ flex: 1, marginBottom: "10px" }}
        >
          <Skeleton
            variant="text"
            width={100}
            height={20}
            sx={{ marginBottom: "8px" }}
          />
          <Stack
            direction="row"
            sx={{
              width: "100%",
              maxWidth: ["150px", "230px"],
              height: "40px",
              backgroundColor: "#F7F7F7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "40px",
              border: "1px solid #DCDCDC",
              marginBottom: "8px",
              paddingLeft: "4px",
              paddingRight: "4px",
              boxSizing: "border-box",
            }}
          >
            <Skeleton variant="rectangular" width={30} height={30} />
            <Divider
              orientation="vertical"
              variant="middle"
              flexItem
              sx={{ marginRight: "8px", marginLeft: "8px" }}
            />
            <Skeleton variant="text" width={30} height={30} />
            <Divider
              orientation="vertical"
              variant="middle"
              flexItem
              sx={{ marginRight: "8px", marginLeft: "8px" }}
            />
            <Skeleton variant="rectangular" width={30} height={30} />
          </Stack>
          <Skeleton variant="text" width={80} height={10} />
        </Stack>
        <Skeleton
          variant="circular"
          width={50}
          height={50}
          className={styles.imageAvatar}
        />
      </Stack>
    </Box>
  );

  const matchColor = (
    match_id: string,
    vote: string,
    foundResult: string,
    notFoundResult: string,
    defaultResult: string
  ) => {
    const pr = votes?.find((pred) => pred.match_id.toString() === match_id);
    if (!pr) {
      return defaultResult;
    }
    return pr.prediction === vote ? foundResult : notFoundResult;
  };

  const disableVote = function (match_id: string, vote: string) {
    const pr = votes?.find((pred) => pred.match_id.toString() === match_id);
    return (pr && pr.prediction === vote) || false;
  };

  const isButtonDiabled = function (match: MatchAndTeamInfo, vote: string) {
    return (
      !isAuthenticated ||
      checkIfKickoffPassed(new Date(match.match_date)) ||
      disableVote(match.match_id.toString(), vote)
    );
  };

  const utcToLocal = function (refUTC: string) {
    const matchDate = new Date(refUTC);
    const conv = new Date(
      matchDate.getTime() - matchDate.getTimezoneOffset() * 60000
    );
    return new Date(conv).toLocaleString("en-US", dateOptions);
  };

  const isKickoffPassed = function (refUTC: string) {
    const matchDate = new Date(refUTC);

    const currentTime = new Date();
    const currentTimeUTC = new Date(
      currentTime.getTime() + currentTime.getTimezoneOffset() * 60000
    );
    return currentTime < matchDate;
  };

  return (
    <Box>
      <Snackbar
        open={voteSnackbar}
        autoHideDuration={2000}
        onClose={() => setvoteSnackbar(false)}
      >
        <Alert severity="info" variant="filled" sx={{ width: "100%" }}>
          Sending your vote!
        </Alert>
      </Snackbar>
      <Snackbar
        open={openSnackbar.open}
        autoHideDuration={5000}
        onClose={() =>
          setopenSnackbar({
            open: false,
            hasError: false,
            error: "",
          })
        }
      >
        {openSnackbar.hasError ? (
          <Alert severity="error" variant="filled" sx={{ width: "100%" }}>
            {openSnackbar.error}
          </Alert>
        ) : (
          <Alert severity="success" variant="filled" sx={{ width: "100%" }}>
            Your Prediction Saved!
          </Alert>
        )}
      </Snackbar>
      <Typography fontWeight={900} variant="body1" mt={2} mb={2} ml={2}>
        PREDICT THE MATCH WINNER!
      </Typography>
      {loading
        ? Array.from(new Array(5)).map((_, index) =>
            renderSkeleton(`matches-key-${index}`)
          )
        : matches
            .filter((m) => isKickoffPassed(m.match_date))
            .map((match, index) => (
              <>
                <Box
                  className="parentBox"
                  key={`${match.match_id}-${match.home_country_short}-${match.away_country_short}`}
                  sx={{
                    position: "relative",
                    marginBottom: "0",
                    borderRadius: "0px",
                    borderTop: "1px solid #DCDCDC",
                    borderBottom: "1px solid #DCDCDC",
                    borderLeft: "none",
                    borderRight: "none",
                    paddingRight: ["0.725rem", "1rem"],
                    paddingLeft: ["0.725rem", "1rem"],
                    // minHeight: "143px",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ padding: "0px", flex: "1 0 auto" }}
                  >
                    {/* {`${isAuthenticated}, ${isButtonDiabled(
                  match,
                  match.home_country_short
                )},${isButtonDiabled(match, "0")},${isButtonDiabled(
                  match,
                  match.away_country_short
                )}`} */}
                    <img
                      src={`/eurocaster_assets/avatars/${match.home_country_short}.png`}
                      className={styles.imageAvatar}
                      alt={match.home_country_short}
                    />
                    <Stack
                      direction="column"
                      justifyContent={"end"}
                      alignItems="center"
                      sx={{ flex: 1, marginBottom: "10px" }}
                    >
                      <Typography
                        fontSize="0.75rem"
                        fontWeight={900}
                        color="textSecondary"
                        marginBottom={"8px"}
                      >
                        WHO WILL WIN?
                      </Typography>
                      <Stack
                        direction="row"
                        sx={{
                          width: "100%",
                          maxWidth: ["150px", "230px"],
                          height: "40px",
                          backgroundColor: "#F7F7F7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "40px",
                          border: "1px solid #DCDCDC",
                          marginBottom: "8px",
                          paddingLeft: "4px",
                          paddingRight: "4px",
                          boxSizing: "border-box",
                        }}
                      >
                        <Button
                          sx={{
                            padding: "0px",
                            flexShrink: 0,
                            minWidth: ["0"],
                          }}
                          disabled={isButtonDiabled(
                            match,
                            match.home_country_short
                          )}
                          onClick={() =>
                            vote(match.match_id, match.home_country_short)
                          }
                        >
                          <Stack direction="row" alignItems="center">
                            <img
                              src={match.home_logo}
                              className={styles.imageFlag}
                              alt={match.home_country}
                              style={{
                                border: isAuthenticated
                                  ? matchColor(
                                      match.match_id.toString(),
                                      match.home_country_short,
                                      "2px solid green",
                                      "none",
                                      "none"
                                    )
                                  : "none",
                                opacity: isAuthenticated
                                  ? matchColor(
                                      match.match_id.toString(),
                                      match.home_country_short,
                                      "1",
                                      "0.5",
                                      "1"
                                    )
                                  : "1",
                              }}
                            />
                            <Typography
                              fontSize="0.75rem"
                              fontWeight={900}
                              mx="4px"
                              sx={{
                                display: { xs: "none", sm: "block" },
                                color: isAuthenticated
                                  ? matchColor(
                                      match.match_id.toString(),
                                      match.home_country_short,
                                      "green",
                                      "black",
                                      "none"
                                    )
                                  : "none",
                                opacity: isAuthenticated
                                  ? matchColor(
                                      match.match_id.toString(),
                                      match.home_country_short,
                                      "1",
                                      "0.5",
                                      "1"
                                    )
                                  : "1",
                              }}
                            >
                              {match.home_country_short}
                            </Typography>
                          </Stack>
                        </Button>
                        {new Date(match.match_date) < new Date(2024, 5, 27) ? (
                          <>
                            {console.log(new Date(2024, 0, 27))}
                            <Divider
                              orientation="vertical"
                              variant="middle"
                              flexItem
                              sx={{ marginRight: "8px", marginLeft: "8px" }}
                            />
                            <Button
                              variant="text"
                              sx={{
                                padding: "0px !important",
                                minWidth: "30px !important",
                                Width: "30px",
                                flexShrink: 0,
                                flexGrow: 0,
                              }}
                              disabled={isButtonDiabled(match, "0")}
                              onClick={() => vote(match.match_id, "0")}
                            >
                              <Typography
                                fontSize="0.75rem"
                                fontWeight={900}
                                sx={{
                                  color: isAuthenticated
                                    ? matchColor(
                                        match.match_id.toString(),
                                        "0",
                                        "green",
                                        "black",
                                        "none"
                                      )
                                    : "none",
                                  opacity: isAuthenticated
                                    ? matchColor(
                                        match.match_id.toString(),
                                        "0",
                                        "1",
                                        "0.5",
                                        "1"
                                      )
                                    : "1",
                                }}
                              >
                                Draw
                              </Typography>
                            </Button>
                            <Divider
                              orientation="vertical"
                              variant="middle"
                              flexItem
                              sx={{ marginRight: "8px", marginLeft: "8px" }}
                            />
                          </>
                        ) : (
                          <Divider
                            orientation="vertical"
                            variant="middle"
                            flexItem
                            sx={{ marginRight: "2rem", marginLeft: "2rem" }}
                          />
                        )}

                        <Button
                          sx={{
                            padding: "0px",
                            flexShrink: 0,
                            minWidth: ["0"],
                          }}
                          disabled={isButtonDiabled(
                            match,
                            match.away_country_short
                          )}
                          onClick={() =>
                            vote(match.match_id, match.away_country_short)
                          }
                        >
                          <Stack direction="row" alignItems="center">
                            <img
                              src={match.away_logo}
                              className={styles.imageFlag}
                              alt={match.away_country}
                              style={{
                                border: isAuthenticated
                                  ? matchColor(
                                      match.match_id.toString(),
                                      match.away_country_short,
                                      "2px solid green",
                                      "none",
                                      "none"
                                    )
                                  : "none",
                                opacity: isAuthenticated
                                  ? matchColor(
                                      match.match_id.toString(),
                                      match.away_country_short,
                                      "1",
                                      "0.5",
                                      "1"
                                    )
                                  : "1",
                              }}
                            />
                            <Typography
                              fontSize="0.75rem"
                              fontWeight={900}
                              mx="4px"
                              sx={{
                                display: {
                                  xs: "none",
                                  sm: "block",
                                  color: isAuthenticated
                                    ? matchColor(
                                        match.match_id.toString(),
                                        match.away_country_short,
                                        "green",
                                        "black",
                                        "none"
                                      )
                                    : "none",
                                  opacity: isAuthenticated
                                    ? matchColor(
                                        match.match_id.toString(),
                                        match.away_country_short,
                                        "1",
                                        "0.5",
                                        "1"
                                      )
                                    : "1",
                                },
                              }}
                            >
                              {match.away_country_short}
                            </Typography>
                          </Stack>
                        </Button>
                      </Stack>
                      <Typography fontSize="0.5rem" color="textSecondary">
                        {new Date(match.match_date).toLocaleString(
                          "en-US",
                          dateOptions
                        )}
                      </Typography>
                    </Stack>
                    <img
                      src={`/eurocaster_assets/avatars/${match.away_country_short}.png`}
                      className={styles.imageAvatar}
                      alt={match.away_country_short}
                    />
                  </Stack>
                </Box>
              </>
            ))}
    </Box>
  );
};

export default Matches;
