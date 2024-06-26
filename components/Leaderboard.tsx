import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from "@mui/material";
import { LeaderboardDataWithRanks } from "@/lib/data/db";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { AuthProvider } from "./Matches";
import { ENSData, getENS } from "@/lib/functions";

interface Leaderboard {
  topUsers: {
    fid: number;
    points: number;
    award: number;
    rank: number;
    name?: string;
    image?: string;
  }[];
  currentUser: {
    fid: number;
    points: number;
    award: number;
    rank: number;
    name?: string;
    image?: string;
  };
}

const Leaderboard = () => {
  const [userId, setUserId] = useState<string>("");
  const { isAuthenticated, user } = useDynamicContext();
  const [leaderboardData, setleaderboardData] =
    useState<LeaderboardDataWithRanks | null>();
  const getUserId = () => {
    return isAuthenticated && user ? user.userId! : "";
  };

  const getEns = async function (data: LeaderboardDataWithRanks) {
    if (data.topUsers && data.topUsers.length > 0) {
      for (const ldr of data.topUsers) {
        const { provider_identifier, provider_name } = ldr;
        if (provider_name === "wallet") {
          // check for ens
          const resp = await fetch(`/api/conf/getens?w=${provider_identifier}`);
          if (resp.ok) {
            const ens: ENSData[] = await resp.json();

            if (ens && ens.length > 0) {
              ldr.profile_picture = ens[0].avatar;
              ldr.username = ens[0].name;
            }
          }
        }
      }
    }
  };

  const fetchUsers = async () => {
    const response = await fetch(
      `/api/conf/leaderboard?user_id=${getUserId()}`
    );
    const data: LeaderboardDataWithRanks = await response.json();
    await getEns(data);
    setleaderboardData(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchUsers();
    setUserId(getUserId());
  }, [isAuthenticated]);

  const getRankColor = (rank: any, d: string) => {
    if (rank === "1") return "#FFA800";
    if (rank === "2") return "#929292";
    if (rank === "3") return "#B96400";
    return d;
  };

  const getColor = (rank: any) => {
    if (rank === "1") return "#FFA800";
    if (rank === "2") return "#929292";
    if (rank === "3") return "#B96400";
    return "inherit";
  };

  const getBgColor = (rank: any) => {
    if (rank === "1") return "#FFEBA5";
    if (rank === "2") return "#FAFAFA";
    if (rank === "3") return "#FFEBCD";
    return "inherit";
  };

  function formatEthereumAddress(
    provider_name: string,
    provider_identifier: string
  ): string {
    if (provider_name === "wallet") {
      const start = provider_identifier.slice(0, 4);
      const end = provider_identifier.slice(-4);

      return `${start}...${end}`;
    }
    return provider_identifier;
  }

  return (
    <Box mb={3} mt={2}>
      {isAuthenticated && leaderboardData?.currentUser && (
        <>
          <Grid container alignItems="flex-start" mb={1}>
            <Grid item xs={7} pl={2}>
              <Typography fontWeight={900} variant="body1">
                MY RANK
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography
                variant="body1"
                fontWeight={900}
                fontSize={["0.725rem"]}
              >
                TROPHIES
              </Typography>
            </Grid>
            <Grid item xs={3} pr={2}>
              <Typography
                variant="body1"
                fontWeight={900}
                fontSize={["0.725rem"]}
                textOverflow={"ellipsis"}
                overflow={"hidden"}
              >
                REWARD
              </Typography>
            </Grid>
          </Grid>
          <Grid
            mb={3}
            key={`c-${leaderboardData?.currentUser.user_id}`}
            container
            alignItems="center"
            sx={{
              borderTop: "1px solid #DCDCDC",
              borderBottom: "1px solid #DCDCDC",
              borderLeft: "none",
              borderRight: "none",
              minHeight: "92px",
              boxSizing: "border-box",
            }}
          >
            <Grid item xs={1} alignItems={"center"} pl={2}>
              <Typography
                variant="h6"
                p={0}
                m={0}
                sx={{
                  fontWeight: "bold",
                  color: "#CDCDCD",
                }}
              >
                {leaderboardData?.currentUser.rank}
              </Typography>
            </Grid>
            <Grid item xs={2} alignItems={"center"} pl={2}>
              <Avatar
                variant="circular"
                sx={{
                  width: ["40px", "65px"],
                  height: ["40px", "65px"],
                  border: "3px solid",
                  borderColor: "inherit",
                }}
                alt="User Avatar"
                src={leaderboardData?.currentUser.profile_picture}
              />
            </Grid>
            <Grid item xs={4} alignItems={"center"}>
              <Typography
                variant="body1"
                ml={2}
                textOverflow={"ellipsis"}
                overflow={"hidden"}
              >
                {leaderboardData?.currentUser.username}
              </Typography>
            </Grid>
            <Grid item xs={2} container alignItems={"center"} pr={2}>
              <Typography fontWeight={900} variant="body1">
                🏆
                {leaderboardData?.currentUser.user_id === null
                  ? 0
                  : leaderboardData?.currentUser.points}
              </Typography>
            </Grid>
            <Grid item xs={3} container alignItems={"center"}>
              <img
                style={{
                  marginRight: "0.5rem",
                  width: "1.2rem",
                  height: "1.2rem",
                }}
                src="/eurocaster_assets/misc/degen.png"
                alt="Degen"
              />
              <Typography fontWeight={900} variant="body1">
                {leaderboardData?.currentUser.user_id === null
                  ? 0
                  : leaderboardData?.currentUser.award}
              </Typography>
            </Grid>
          </Grid>
        </>
      )}
      <Grid container alignItems="flex-start" mb={1}>
        <Grid item xs={7} pl={2}>
          <Typography fontWeight={900} variant="body1">
            LEADERBOARD
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography variant="body1" fontWeight={900} fontSize={["0.725rem"]}>
            TROPHIES
          </Typography>
        </Grid>
        <Grid item xs={3} pr={2}>
          <Typography
            variant="body1"
            fontWeight={900}
            fontSize={["0.725rem"]}
            textOverflow={"ellipsis"}
            overflow={"hidden"}
          >
            REWARD
          </Typography>
        </Grid>
      </Grid>

      {leaderboardData
        ? leaderboardData?.topUsers
            .sort((x, y) => x.rank - y.rank)
            .map((user, index) => (
              <Box key={`ldr_data_${index}`}>
                <Grid
                  key={`${user.user_id}-${index}`}
                  container
                  alignItems="center"
                  sx={{
                    borderTop: getUserId() ? "" : "1px solid #DCDCDC",
                    borderBottom: getUserId() ? "" : "1px solid #DCDCDC",
                    borderLeft: "none",
                    borderRight: "none",
                    minHeight: "92px",
                    boxSizing: "border-box",
                  }}
                >
                  <Grid item xs={1} alignItems={"center"} pl={2}>
                    <Typography
                      variant="h6"
                      p={0}
                      m={0}
                      sx={{
                        fontWeight: "bold",
                        color: getRankColor(user.rank, "#CDCDCD"),
                      }}
                    >
                      {user.rank}
                    </Typography>
                  </Grid>
                  <Grid item xs={2} alignItems={"center"} pl={2}>
                    <Avatar
                      variant="circular"
                      sx={{
                        width: ["40px", "65px"],
                        height: ["40px", "65px"],
                        border: "3px solid",
                        borderColor: getRankColor(user.rank, "inherit"),
                      }}
                      alt="User Avatar"
                      src={user.profile_picture ? user.profile_picture : ""}
                    />
                  </Grid>
                  <Grid item xs={4} alignItems={"center"}>
                    <Typography
                      variant="body1"
                      textOverflow={"ellipsis"}
                      overflow={"hidden"}
                      ml={2}
                      sx={{ color: getRankColor(user.rank, "inherit") }}
                    >
                      {user.username
                        ? user.username
                        : formatEthereumAddress(
                            user.provider_name,
                            user.provider_identifier
                          )}
                    </Typography>
                  </Grid>
                  <Grid item xs={2} container alignItems={"center"} pr={2}>
                    <Typography fontWeight={900} variant="body1">
                      🏆 {user.points}
                    </Typography>
                  </Grid>
                  <Grid item xs={3} container alignItems={"center"}>
                    <img
                      style={{
                        marginRight: "0.5rem",
                        width: "1.2rem",
                        height: "1.2rem",
                      }}
                      src="/eurocaster_assets/misc/degen.png"
                      alt="Degen"
                    />
                    <Typography fontWeight={900} variant="body1">
                      {user.award}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            ))
        : Array.from(new Array(20)).map((_, index) => (
            <Box key={`ldr_skl_${index}`}>
              <Grid
                container
                alignItems="center"
                sx={{
                  borderTop: "1px solid #DCDCDC",
                  borderBottom: "1px solid #DCDCDC",
                  borderLeft: "none",
                  borderRight: "none",
                  minHeight: "92px",
                  boxSizing: "border-box",
                }}
              >
                <Grid item xs={1} alignItems={"center"} pl={2}>
                  <Skeleton variant="text" width={30} height={30} />
                </Grid>
                <Grid item xs={2} alignItems={"center"} pl={2}>
                  <Skeleton variant="circular" width={65} height={65} />
                </Grid>
                <Grid item xs={4} alignItems={"center"}>
                  <Skeleton variant="text" width="80%" height={30} />
                </Grid>
                <Grid item xs={2} container alignItems={"center"} pr={2}>
                  <Skeleton variant="text" width={50} height={30} />
                </Grid>
                <Grid item xs={3} container alignItems={"center"}>
                  <Skeleton
                    variant="rectangular"
                    width={24}
                    height={24}
                    style={{ marginRight: "0.5rem" }}
                  />
                  <Skeleton variant="text" width={80} height={30} />
                </Grid>
              </Grid>
            </Box>
          ))}
    </Box>
  );
};

export default Leaderboard;
