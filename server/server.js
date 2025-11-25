const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'db.json');
const upload = multer({ dest: 'uploads/' });

// CORS configuration - allow multiple origins for local development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !process.env.CLIENT_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json());

// Helper to read DB
const readDb = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { users: [], resources: [], polls: [] };
  }
};

// Helper to write DB
const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Auth Login
app.post('/api/login', (req, res) => {
  const { mobile, password } = req.body;
  const db = readDb();
  const user = db.users.find(u => u.mobile === mobile && u.password === password);
  
  if (user) {
    res.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Helper to generate 6-digit ID
const generateId = () => Math.floor(100000 + Math.random() * 900000);

// Get Resources (Filtered by Manager)
app.get('/api/resources', (req, res) => {
  const db = readDb();
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.json(db.resources); // Fallback for backward compatibility/testing
  }

  const user = db.users.find(u => u.id == userId);
  
  if (user && user.role === 'manager') {
    // Manager sees only their own resources
    const managerResources = db.resources.filter(r => r.managerId == userId);
    res.json(managerResources);
  } else if (user && user.role === 'user') {
    // User sees resources under the same manager (their team)
    // First find this user's resource record to get their managerId
    const userResource = db.resources.find(r => r.mobile === user.mobile);
    if (userResource && userResource.managerId) {
      const teamResources = db.resources.filter(r => r.managerId == userResource.managerId);
      res.json(teamResources);
    } else {
      // Fallback: see only themselves if not linked to a manager properly
      res.json(db.resources.filter(r => r.mobile === user.mobile));
    }
  } else {
    res.json([]);
  }
});

// Add Resource (Manager only) - Auto Create User
app.post('/api/resources', (req, res) => {
  const db = readDb();
  const { mobile, name } = req.body;
  const managerId = req.headers['x-user-id'];

  if (!managerId) {
    return res.status(400).json({ message: 'Manager ID required' });
  }

  // Check unique mobile
  if (db.resources.some(r => r.mobile === mobile)) {
    return res.status(400).json({ message: 'Mobile number already exists' });
  }

  const newResource = { 
    id: generateId(), 
    ...req.body,
    managerId: Number(managerId) // Assign to current manager
  };
  db.resources.push(newResource);

  // Auto-create user
  if (!db.users.some(u => u.mobile === mobile)) {
    db.users.push({
      id: generateId(),
      mobile: mobile,
      password: mobile, // Password same as mobile
      role: 'user',
      name: name
    });
  }

  writeDb(db);
  res.json(newResource);
});

// Helper to parse date
const parseDate = (dateStr) => {
  if (!dateStr) return '';
  
  // Handle Excel Serial Date
  if (typeof dateStr === 'number') {
    const date = new Date((dateStr - (25567 + 2)) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }

  // Handle DD-MM-YYYY
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 2 && parts[2].length === 4) {
      // Assuming DD-MM-YYYY
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  
  return dateStr; // Return as is if already YYYY-MM-DD or unknown
};

// Get All Users (Manager only for Poll tracking)
app.get('/api/users', (req, res) => {
  const db = readDb();
  // Return only necessary info
  const users = db.users.map(u => ({ id: u.id, name: u.name, mobile: u.mobile, role: u.role }));
  res.json(users);
});

// Bulk Upload Resources
app.post('/api/resources/bulk', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const managerId = req.headers['x-user-id'];
  if (!managerId) {
    return res.status(400).json({ message: 'Manager ID required' });
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const db = readDb();
    let addedCount = 0;
    let skippedCount = 0;

    console.log('=== BULK UPLOAD DEBUG ===');
    console.log(`Total rows in Excel: ${data.length}`);
    console.log('First row sample:', JSON.stringify(data[0], null, 2));
    console.log('========================');

    data.forEach(row => {
      // Map Excel headers to DB fields
      // Handle mobile as number or string from Excel
      let mobile = row['Mobile'];
      if (typeof mobile === 'number') {
        mobile = String(Math.floor(mobile)); // Convert number to string, remove decimals
      } else {
        mobile = String(mobile || '').trim();
      }
      
      console.log(`Processing row: ${row['Name']}, Mobile: ${mobile}, Type: ${typeof row['Mobile']}`);
      
      if (mobile && !db.resources.some(r => r.mobile === mobile)) {
        const newResource = {
          id: generateId(),
          name: row['Name'],
          project: row['Project'],
          joiningDate: parseDate(row['Joining Date']),
          birthday: parseDate(row['Birthday']),
          diet: row['Diet'] || 'Veg',
          skills: row['Skills'],
          gender: row['Gender'] || row['Sex'] || 'Male', // Support both headers
          mobile: mobile,
          managerId: Number(managerId) // Assign to current manager
        };
        
        db.resources.push(newResource);

        // Auto-create user
        if (!db.users.some(u => u.mobile === mobile)) {
          db.users.push({
            id: generateId(),
            mobile: mobile,
            password: mobile,
            role: 'user',
            name: row['Name']
          });
        }
        addedCount++;
        console.log(`✓ Added: ${row['Name']}`);
      } else {
        skippedCount++;
        console.log(`✗ Skipped: ${row['Name']} (${mobile ? 'duplicate' : 'no mobile'})`);
      }
    });

    writeDb(db);
    fs.unlinkSync(req.file.path); // Clean up uploaded file
    res.json({ success: true, message: `Added ${addedCount} resources. Skipped ${skippedCount} duplicates.` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to process file' });
  }
});

// Update Resource
app.put('/api/resources/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const managerId = req.headers['x-user-id'];
  
  const resourceIndex = db.resources.findIndex(r => r.id == id);
  
  if (resourceIndex !== -1) {
    // Verify ownership
    if (managerId && db.resources[resourceIndex].managerId != managerId) {
      return res.status(403).json({ message: 'Unauthorized access to this resource' });
    }

    // Validate mobile number uniqueness (excluding current resource)
    if (req.body.mobile) {
      const existingResource = db.resources.find(r => r.mobile === req.body.mobile && r.id != id);
      if (existingResource) {
        return res.status(400).json({ message: 'Mobile number already exists' });
      }
    }
    
    const oldMobile = db.resources[resourceIndex].mobile;
    const updatedResource = { ...db.resources[resourceIndex], ...req.body, id: parseInt(id) };
    db.resources[resourceIndex] = updatedResource;
    
    // Update user if mobile changed
    if (oldMobile !== req.body.mobile) {
      const userIndex = db.users.findIndex(u => u.mobile === oldMobile);
      if (userIndex !== -1) {
        db.users[userIndex].mobile = req.body.mobile;
        db.users[userIndex].password = req.body.mobile;
        db.users[userIndex].name = req.body.name;
      }
    }
    
    writeDb(db);
    res.json(updatedResource);
  } else {
    res.status(404).json({ message: 'Resource not found' });
  }
});

// Delete Resource
app.delete('/api/resources/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const managerId = req.headers['x-user-id'];

  const resource = db.resources.find(r => r.id == id);
  
  if (resource) {
    // Verify ownership
    if (managerId && resource.managerId != managerId) {
      return res.status(403).json({ message: 'Unauthorized access to this resource' });
    }

    // Delete the resource
    db.resources = db.resources.filter(r => r.id != id);
    
    // Find and delete the associated user account
    const userToDelete = db.users.find(u => u.mobile === resource.mobile);
    if (userToDelete) {
      const userId = userToDelete.id;
      
      // Delete the user
      db.users = db.users.filter(u => u.id !== userId);
      
      // Clean up all polls - remove this user from votedUsers arrays and decrement vote counts
      db.polls.forEach(poll => {
        if (poll.votedUsers && poll.votedUsers.includes(userId)) {
          poll.votedUsers = poll.votedUsers.filter(id => id !== userId);
          
          // Decrement vote count for the option they voted for
          if (poll.userVotes && poll.userVotes[userId]) {
            const votedOption = poll.userVotes[userId];
            const option = poll.options.find(o => o.label === votedOption);
            if (option && option.votes > 0) {
              option.votes -= 1;
            }
            delete poll.userVotes[userId];
          }
        }
      });
    }
    
    writeDb(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: 'Resource not found' });
  }
});

// Get Polls (Filtered by Manager)
app.get('/api/polls', (req, res) => {
  const db = readDb();
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.json(db.polls);
  }

  const user = db.users.find(u => u.id == userId);
  
  if (user && user.role === 'manager') {
    // Manager sees only their own polls
    const managerPolls = db.polls.filter(p => p.managerId == userId);
    res.json(managerPolls);
  } else if (user && user.role === 'user') {
    // User sees polls from their manager
    const userResource = db.resources.find(r => r.mobile === user.mobile);
    if (userResource && userResource.managerId) {
      const teamPolls = db.polls.filter(p => p.managerId == userResource.managerId);
      res.json(teamPolls);
    } else {
      res.json([]);
    }
  } else {
    res.json([]);
  }
});

// Create Poll (Manager only)
app.post('/api/polls', (req, res) => {
  const db = readDb();
  const managerId = req.headers['x-user-id'];

  if (!managerId) {
    return res.status(400).json({ message: 'Manager ID required' });
  }

  const newPoll = { 
    id: generateId(), 
    ...req.body, 
    options: req.body.options.map(opt => ({ label: opt, votes: 0 })),
    votedUsers: [],
    managerId: Number(managerId) // Assign to current manager
  };
  db.polls.push(newPoll);
  writeDb(db);
  res.json(newPoll);
});

// Vote Poll
app.post('/api/polls/:id/vote', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const { userId, optionLabel } = req.body;
  
  const poll = db.polls.find(p => p.id == id);
  if (poll) {
    if (poll.votedUsers.includes(userId)) {
      return res.status(400).json({ message: 'Already voted' });
    }
    
    const option = poll.options.find(o => o.label === optionLabel);
    if (option) {
      option.votes += 1;
      poll.votedUsers.push(userId);
      
      // Track which user voted for which option
      if (!poll.userVotes) {
        poll.userVotes = {};
      }
      poll.userVotes[userId] = optionLabel;
      
      writeDb(db);
      res.json(poll);
    } else {
      res.status(400).json({ message: 'Invalid option' });
    }
  } else {
    res.status(404).json({ message: 'Poll not found' });
  }
});

// Delete Poll (Manager only)
app.delete('/api/polls/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const managerId = req.headers['x-user-id'];

  const poll = db.polls.find(p => p.id == id);

  if (poll) {
    // Verify ownership
    if (managerId && poll.managerId != managerId) {
      return res.status(403).json({ message: 'Unauthorized access to this poll' });
    }

    db.polls = db.polls.filter(p => p.id != id);
    writeDb(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: 'Poll not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
