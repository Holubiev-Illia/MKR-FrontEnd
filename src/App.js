import React, { useState, useEffect } from "react";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  CssBaseline,
  Grid,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
  Paper,
  Tab,
  Tabs,
  Alert,
  IconButton,
  Tooltip,
  Fade,
  Chip,
  CircularProgress,
  Snackbar,
  Link,
} from "@mui/material";
import {
  ContentCopy,
  OpenInNew,
  Person,
  LogoutOutlined,
  Add,
  LinkOutlined,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import axios from "axios";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#000000",
    },
    secondary: {
      main: "#ffffff",
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#000000",
      secondary: "#666666",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
          padding: "10px 20px",
        },
        containedPrimary: {
          backgroundColor: "#000",
          color: "#fff",
          "&:hover": {
            backgroundColor: "#333",
          },
        },
        outlinedPrimary: {
          borderColor: "#000",
          color: "#000",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          border: "1px solid #eee",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          },
        },
      },
    },
  },
});

const API_BASE = "http://localhost:8000/api";

export default function App() {
  const [view, setView] = useState("login");
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [urls, setUrls] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    full_name: "",
  });
  const [newUrlForm, setNewUrlForm] = useState({ url: "" });

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: "Copied to clipboard!" });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", loginForm.username);
      formData.append("password", loginForm.password);

      const response = await axios.post(`${API_BASE}/login`, formData);
      setToken(response.data.access_token);
      setLoginForm({ username: "", password: "" });
      setError("");
      await fetchUserData(response.data.access_token);
      setSnackbar({ open: true, message: "Welcome back!" });
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/register`, registerForm);
      setSuccessMessage("Registration successful! Please login.");
      setView("login");
      setRegisterForm({ username: "", password: "", full_name: "" });
      setError("");
    } catch (err) {
      setError("Registration failed. Username might be taken.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    setUrls([]);
    setView("login");
    setSnackbar({ open: true, message: "Logged out successfully" });
  };

  const fetchUserData = async (currentToken) => {
    try {
      const response = await axios.get(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setUser(response.data);
      setView("dashboard");
    } catch (err) {
      setError("Failed to fetch user data");
      setToken("");
    }
  };

  const fetchUrls = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/me/urls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUrls(response.data);
    } catch (err) {
      setError("Failed to fetch URLs");
    } finally {
      setLoading(false);
    }
  };
  const handleUrlClick = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    fetchUrls();
    setRefreshTrigger((prev) => prev + 1);
  };
  const createShortUrl = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/me/urls`, newUrlForm, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setNewUrlForm({ url: "" });
      setSnackbar({ open: true, message: "URL shortened successfully!" });
      fetchUrls();
    } catch (err) {
      setError("Failed to create short URL");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUrls();
    }
  }, [token]);

  const UrlStats = ({ url }) => {
    const [clickData, setClickData] = useState([]);
    const [timeView, setTimeView] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const fetchClickData = async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `${API_BASE}/me/links/${url.short}/redirects`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const clicks = response.data;
          const groupedData = clicks.reduce((acc, timestamp) => {
            const date = new Date(timestamp);
            let key;

            switch (timeView) {
              case 0:
                key = `${date.getHours()}:${String(date.getMinutes()).padStart(
                  2,
                  "0"
                )}`;

                break;
              case 1:
                key = `${date.toLocaleDateString()} ${date.getHours()}:00`;
                break;
              case 2:
                key = date.toLocaleDateString();
                break;
              default:
                key = date.toLocaleDateString();
            }

            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});

          const chartData = Object.entries(groupedData)
            .map(([time, clicks]) => ({
              time,
              clicks,
            }))
            .sort((a, b) => {
              if (timeView === 2) {
                const [aHour, aMin] = a.time.split(":").map(Number);
                const [bHour, bMin] = b.time.split(":").map(Number);
                return aHour * 60 + aMin - (bHour * 60 + bMin);
              }
              return new Date(a.time) - new Date(b.time);
            });

          setClickData(chartData);
        } catch (err) {
          console.error("Failed to fetch click data");
        } finally {
          setLoading(false);
        }
      };

      fetchClickData();
    }, [url.short, timeView, token]);

    return (
      <Box sx={{ mt: 3 }}>
        <Tabs
          value={timeView}
          onChange={(e, newValue) => setTimeView(newValue)}
          variant="fullWidth"
          sx={{
            mb: 2,
            "& .MuiTabs-indicator": {
              backgroundColor: "#000",
            },
            "& .MuiTab-root": {
              color: "#666",
              "&.Mui-selected": {
                color: "#000",
              },
            },
          }}
        >
          <Tab label="Minutes" />
          <Tab label="Hours" />
          <Tab label="Days" />
        </Tabs>
        <Box sx={{ height: 300, position: "relative" }}>
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <CircularProgress size={40} sx={{ color: "#000" }} />
            </Box>
          ) : (
            <ResponsiveContainer>
              <LineChart data={clickData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="time" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #eee",
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#000"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#000" }}
                  activeDot={{ r: 6, fill: "#000" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Box>
      </Box>
    );
  };

  const renderLogin = () => (
    <Fade in={true}>
      <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
        <Typography variant="h4" gutterBottom>
          Welcome Back
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          Sign in to your account to continue
        </Typography>

        <TextField
          margin="normal"
          required
          fullWidth
          label="Username"
          value={loginForm.username}
          onChange={(e) =>
            setLoginForm({ ...loginForm, username: e.target.value })
          }
          InputProps={{
            startAdornment: <Person sx={{ mr: 1, color: "action.active" }} />,
          }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          label="Password"
          type="password"
          value={loginForm.password}
          onChange={(e) =>
            setLoginForm({ ...loginForm, password: e.target.value })
          }
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ mt: 3, mb: 2, height: 48 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setView("register")}
          sx={{ height: 48 }}
        >
          Create new account
        </Button>
      </Box>
    </Fade>
  );

  const renderRegister = () => (
    <Fade in={true}>
      <Box component="form" onSubmit={handleRegister} sx={{ mt: 1 }}>
        <Typography variant="h4" gutterBottom>
          Create Account
        </Typography>

        <TextField
          margin="normal"
          required
          fullWidth
          label="Username"
          value={registerForm.username}
          onChange={(e) =>
            setRegisterForm({ ...registerForm, username: e.target.value })
          }
          InputProps={{
            startAdornment: <Person sx={{ mr: 1, color: "action.active" }} />,
          }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          label="Password"
          type="password"
          value={registerForm.password}
          onChange={(e) =>
            setRegisterForm({ ...registerForm, password: e.target.value })
          }
        />
        <TextField
          margin="normal"
          fullWidth
          label="Name"
          value={registerForm.full_name}
          onChange={(e) =>
            setRegisterForm({ ...registerForm, full_name: e.target.value })
          }
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ mt: 3, mb: 2, height: 48 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setView("login")}
          sx={{ height: 48 }}
        >
          Back to login
        </Button>
      </Box>
    </Fade>
  );
  const renderUrlCard = (url) => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6">Short URL</Typography>
              <Chip
                label={`${url.redirects} clicks`}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Box>
            <Box display="flex" alignItems="center" mt={1}>
              <Typography
                variant="body1"
                component="div"
                sx={{
                  bgcolor: "grey.100",
                  p: 1,
                  borderRadius: 1,
                  flexGrow: 1,
                  fontFamily: "monospace",
                }}
              >
                {`localhost:8000/${url.short}`}
              </Typography>
              <Tooltip title="Copy to clipboard">
                <IconButton
                  onClick={() =>
                    copyToClipboard(`http://localhost:8000/${url.short}`)
                  }
                >
                  <ContentCopy />
                </IconButton>
              </Tooltip>
              <Tooltip title="Open in new tab">
                <IconButton
                  href={`http://localhost:8000/${url.short}`}
                  target="_blank"
                  onClick={handleUrlClick}
                >
                  <OpenInNew />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Typography color="text.secondary" gutterBottom>
              Original URL:
              <Link href={url.url} target="_blank" sx={{ ml: 1 }}>
                {url.url}
              </Link>
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Created {new Date(url.created_at).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <UrlStats url={url} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderDashboard = () => (
    <Box sx={{ flexGrow: 1 }}>
      <Box component="form" onSubmit={createShortUrl} sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs>
            <TextField
              fullWidth
              placeholder="Enter URL to shorten"
              value={newUrlForm.url}
              onChange={(e) => setNewUrlForm({ url: e.target.value })}
              InputProps={{
                startAdornment: <Add sx={{ mr: 1, color: "action.active" }} />,
              }}
            />
          </Grid>
          <Grid item>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ height: "56px", px: 4 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Shorten"
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Box>{urls.map((url) => renderUrlCard(url))}</Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "#fafafa" }}>
        {token && (
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              bgcolor: "#fff",
              borderBottom: "1px solid #eee",
            }}
          >
            <Toolbar>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  flexGrow: 1,
                  color: "#000",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <LinkOutlined />
                Shortener
              </Typography>
              <Chip
                icon={<Person sx={{ color: "#000" }} />}
                label={user?.username}
                variant="outlined"
                sx={{
                  mr: 2,
                  borderColor: "#000",
                  color: "#000",
                }}
              />
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: "#000",
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <LogoutOutlined />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}

        <Container maxWidth="lg" sx={{ pt: token ? 10 : 4, pb: 4 }}>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}
          {successMessage && (
            <Alert
              severity="success"
              sx={{
                mb: 2,
                borderRadius: 2,
              }}
            >
              {successMessage}
            </Alert>
          )}

          <Paper
            elevation={0}
            sx={{
              p: 4,
              border: "1px solid #eee",
              borderRadius: 3,
              bgcolor: "#fff",
            }}
          >
            {view === "login" && renderLogin()}
            {view === "register" && renderRegister()}
            {view === "dashboard" && renderDashboard()}
          </Paper>
        </Container>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          message={snackbar.message}
        />
      </Box>
    </ThemeProvider>
  );
}
