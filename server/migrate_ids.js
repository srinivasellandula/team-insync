const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');
const BACKUP_FILE = path.join(__dirname, 'db.backup.json');

// Helper to generate 6-digit ID
const generateId = (existingIds) => {
  let id;
  do {
    id = Math.floor(100000 + Math.random() * 900000);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
};

const migrate = () => {
  try {
    // Read DB
    if (!fs.existsSync(DB_FILE)) {
      console.error('db.json not found!');
      return;
    }
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

    // Backup DB
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2));
    console.log('Backup created at db.backup.json');

    const usedIds = new Set();
    const userIdMap = new Map(); // oldId -> newId

    // 1. Migrate Users
    console.log('Migrating Users...');
    data.users = data.users.map(user => {
      const newId = generateId(usedIds);
      userIdMap.set(user.id, newId);
      return { ...user, id: newId };
    });

    // 2. Migrate Resources
    console.log('Migrating Resources...');
    data.resources = data.resources.map(resource => {
      // Generate new ID for resource itself
      const newId = generateId(usedIds);
      
      // Update managerId reference
      let newManagerId = resource.managerId;
      if (resource.managerId && userIdMap.has(resource.managerId)) {
        newManagerId = userIdMap.get(resource.managerId);
      }

      return { ...resource, id: newId, managerId: newManagerId };
    });

    // 3. Migrate Polls
    console.log('Migrating Polls...');
    data.polls = data.polls.map(poll => {
      const newId = generateId(usedIds);
      
      // Update managerId reference
      let newManagerId = poll.managerId;
      if (poll.managerId && userIdMap.has(poll.managerId)) {
        newManagerId = userIdMap.get(poll.managerId);
      }

      // Update votedUsers array
      const newVotedUsers = (poll.votedUsers || []).map(oldUserId => {
        return userIdMap.has(oldUserId) ? userIdMap.get(oldUserId) : oldUserId;
      });

      // Update userVotes object keys
      const newUserVotes = {};
      if (poll.userVotes) {
        Object.keys(poll.userVotes).forEach(oldUserId => {
          // Object keys are strings, need to convert to number for map lookup if map keys are numbers
          // But map keys are likely numbers from JSON.parse
          // Let's try direct lookup and loose comparison
          let mappedId = oldUserId;
          // Check map (keys might be numbers or strings depending on original data)
          // We'll iterate to be safe or just check both
          if (userIdMap.has(oldUserId)) mappedId = userIdMap.get(oldUserId);
          else if (userIdMap.has(Number(oldUserId))) mappedId = userIdMap.get(Number(oldUserId));
          
          newUserVotes[mappedId] = poll.userVotes[oldUserId];
        });
      }

      return { 
        ...poll, 
        id: newId, 
        managerId: newManagerId,
        votedUsers: newVotedUsers,
        userVotes: newUserVotes
      };
    });

    // Save DB
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    console.log('Migration completed successfully!');
    console.log('User ID Mapping:', Object.fromEntries(userIdMap));

  } catch (err) {
    console.error('Migration failed:', err);
  }
};

migrate();
