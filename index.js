const express = require("express");
const cors = require("cors");
const app = express();
// Use the environment's PORT or default to 3001 to avoid conflict with Next.js (which uses 3000).
const PORT = process.env.PORT || 3001;

// Middleware to parse incoming JSON request bodies (e.g., from req.body).
app.use(express.json());

// Middleware to enable Cross-Origin Resource Sharing.
// This allows our Frontend (running on port 3000) to communicate with this Backend (on port 3001).
app.use(cors());

// --- Mock Data Storage ---
// In a real app, this would be a database (like Firebase, MongoDB, or SQL).
// For now, we store data in memory variables. Note: This data resets if the server restarts.
let mockUsers = [
  {
    username: "mark3",
    password: "123", // In production, never store passwords as plain text! Use hashing (e.g., bcrypt).
    role: "Head",
    dept: "IT",
  },
];

let mockNotifications = [];

// Track which departments already exist to determine if a new user should be "Head".
let existingDepartments = ["IT"];

let mockTickets = [
  {
    globalId: 1,
    id: 1,
    title: "System Crash",
    description: "The main server crashed",
    priority: "High",
    status: "Pending",
    createdBy: "mark3",
    dept: "IT",
    date: new Date().toISOString(),
  },
];

// --- Routes ---

// Health Check Endpoint
// Used to verify the server is running. Access via http://localhost:3001/health
app.get("/api/tickets", (req, res) => {
  res.json(mockTickets);
});

// Get Tickets Route
// GET /api/tickets
app.get("/api/tickets/:id", (req, res) => {
  const { id } = req.params;
  // We use == instead of === because req.params.id is a string and globalId is a number
  const ticket = mockTickets.find((t) => t.globalId == id);

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  res.json(ticket);
});

app.post("/api/tickets", (req, res) => {
  const { title, description, priority, category, createdBy, dept } = req.body;

  if (!title || !priority || !createdBy) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const userTickets = mockTickets.filter((t) => t.createdBy === createdBy);
  const nextUserId =
    userTickets.length > 0 ? Math.max(...userTickets.map((t) => t.id)) + 1 : 1;

  const newTicket = {
    globalId: Date.now(),
    id: nextUserId,
    title,
    description: description || "",
    priority,
    category: category || "General",
    status: "Pending",
    createdBy,
    dept,
    date: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  mockTickets.push(newTicket);

  // --- NOTIFICATION LOGIC ---
  // 1. Find the Heads to notify
  const headsInDept = mockUsers.filter(
    (u) => u.role === "Head" && u.dept === dept,
  );
  const recipients =
    headsInDept.length > 0
      ? headsInDept.map((h) => h.username)
      : mockUsers.filter((u) => u.role === "Head").map((h) => h.username);

  // 2. Create notification objects
  recipients.forEach((recipient, i) => {
    mockNotifications.push({
      id: Date.now() + i,
      recipientId: recipient, // This matches the username
      message: `New ticket from ${createdBy}: "${title}"`,
      type: "ticket_created",
      is_read: false,
      created_at: new Date().toISOString(),
      ticketGlobalId: newTicket.globalId,
    });
  });

  res.status(201).json(newTicket);
});

// --- Notifications Routes (MUST BE OUTSIDE THE POST ROUTE) ---

// GET: Fetch for a specific user
app.get("/api/notifications/:userId", (req, res) => {
  const { userId } = req.params;
  const userNotifications = mockNotifications.filter(
    (n) => n.recipientId === userId,
  );
  res.json(userNotifications);
});

// GET: Global debug (Optional)
app.get("/api/notifications", (req, res) => {
  res.json(mockNotifications);
});

// Update Ticket Route
app.put("/api/tickets/:id", (req, res) => {
  const { id } = req.params;

  // 1. ADD lastUpdated here to capture it from your Frontend request
  const { title, description, priority, category, lastUpdated } = req.body;

  const ticketIndex = mockTickets.findIndex((t) => t.globalId == id);

  if (ticketIndex === -1) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  // 2. Map the lastUpdated field into the mockTickets array
  mockTickets[ticketIndex] = {
    ...mockTickets[ticketIndex],
    title: title || mockTickets[ticketIndex].title,
    description: description || mockTickets[ticketIndex].description,
    priority: priority || mockTickets[ticketIndex].priority,
    category: category || mockTickets[ticketIndex].category,
    // 3. Save the new timestamp!
    lastUpdated: lastUpdated || new Date().toISOString(),
  };

  console.log(
    `Ticket ${id} updated at: ${mockTickets[ticketIndex].lastUpdated}`,
  );
  res.json(mockTickets[ticketIndex]);
});

// Register Route
// POST /api/register
app.post("/api/register", (req, res) => {
  const { username, password, department } = req.body;

  // Basic validation
  if (!username || !password || !department) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if user already exists
  if (mockUsers.find((u) => u.username === username)) {
    return res.status(409).json({ message: "Username already taken" });
  }

  // Determine Role Logic:
  // If the department is new (not in existingDepartments), the first user becomes the "Head".
  // Otherwise, they are a regular "User".
  let role = "User";
  if (!existingDepartments.includes(department)) {
    existingDepartments.push(department);
    role = "Head";
  }

  // Create the new user object
  const newUser = { username, password, role, dept: department };
  mockUsers.push(newUser);

  console.log(`Registered: ${username} as ${role} in ${department}`);

  // Return success response (201 Created)
  res
    .status(201)
    .json({ message: "User registered successfully", role, username });
});

// Login Route
// POST /api/login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // Find user matching both username and password
  const user = mockUsers.find(
    (u) => u.username === username && u.password === password,
  );

  if (user) {
    // If found, return the user data (Client will store this).
    res.json(user);
  } else {
    // If not found, return 401 Unauthorized.
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
