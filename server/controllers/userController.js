const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db");
require("dotenv").config(); 

exports.registerUsers = async (req, res) => {
  const {
    firstName, lastName, email, phoneNumber, password, companyName, role, 
    designation, department, jobLocation, dateOfBirth, bloodGroup, 
    technicalSkills, employeeId, gender, confirmPassword
  } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }
  if (!confirmPassword) {
    return res.status(400).json({ error: "Confirm password is required" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }
  if (!req.file) {
    return res.status(400).json({ error: "Photo is required" });
  }

  const photo = `/uploads/${req.file.filename}`;

  try {
    const checkEmailQuery = "SELECT email FROM users WHERE email = ?";
    db.query(checkEmailQuery, [email], async (err, results) => {
      if (err) {
        console.error("MySQL error:", err);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      if (results.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const insertQuery = `INSERT INTO users 
          (firstName, lastName, email, phoneNumber, password, companyName, role, 
           designation, department, jobLocation, dateOfBirth, bloodGroup, photo, 
           technicalSkills, employeeId, gender, confirmPassword) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(
          insertQuery,
          [
            firstName, lastName, email, phoneNumber, hashedPassword, companyName,
            role, designation, department, jobLocation, dateOfBirth, bloodGroup,
            photo, technicalSkills, employeeId, gender, confirmPassword
          ],
          (err, result) => {
            if (err) {
              console.error("MySQL error:", err);
              return res.status(500).json({ error: "Failed to add user", details: err.message });
            }
            res.status(201).json({ message: "User added successfully" });
          }
        );
      } catch (hashError) {
        console.error("Error hashing password:", hashError);
        return res.status(500).json({ error: "Error hashing password", details: hashError.message });
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.registerUser = async (req, res) => {
  const {firstName, lastName, email, phoneNumber, password, companyName,role, designation, department, jobLocation, dateOfBirth,bloodGroup, technicalSkills, gender, confirmPassword} = req.body;
  
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const checkEmailQuery = "SELECT email FROM users WHERE email = ?";
    db.query(checkEmailQuery, [email], async (err, results) => {
      if (err) {
        console.error("MySQL error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (results.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const getLastEmployeeQuery = `
        SELECT employeeId FROM users WHERE companyName = ?  ORDER BY employeeId DESC LIMIT 1
      `;
      db.query(getLastEmployeeQuery, [companyName], async (err, results) => {
        if (err) {
          console.error("MySQL error:", err);
          return res.status(500).json({ error: "Error fetching last employee ID" });
        }

        let newEmployeeId;
        if (results.length > 0) {
          const lastEmployeeId = results[0].employeeId;
          const prefix = lastEmployeeId.slice(0, 2);
          const number = parseInt(lastEmployeeId.slice(2)) + 1;
          newEmployeeId = `${prefix}${number.toString().padStart(3, '0')}`;
        } else {
          newEmployeeId = companyName === "Karncy" ? "KC001" : "KN001";
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const insertQuery = `INSERT INTO users 
          (firstName, lastName, email, phoneNumber, password, companyName, role, designation, department, jobLocation, dateOfBirth, bloodGroup, photo, technicalSkills, employeeId, gender, confirmPassword) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(insertQuery, 
          [firstName, lastName, email, phoneNumber, hashedPassword, companyName, role, designation, department, jobLocation, dateOfBirth, bloodGroup, photo, technicalSkills, newEmployeeId, gender, confirmPassword], 
          (err, result) => {
            if (err) {
              console.error("MySQL error:", err);
              return res.status(500).json({ error: "Failed to add user" });
            }
            res.status(201).json({ message: "User added successfully", employeeId: newEmployeeId });
          }
        );
      });
    });
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.registerUser = async (req, res) => {
  const {firstName, lastName, email, phoneNumber, password, companyName,role, designation, department, jobLocation, dateOfBirth,bloodGroup, technicalSkills, gender, confirmPassword} = req.body;
  
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const checkEmailQuery = "SELECT email FROM users WHERE email = ?";
    db.query(checkEmailQuery, [email], async (err, results) => {
      if (err) {
        console.error("MySQL error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (results.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const getLastEmployeeQuery = `
        SELECT employeeId FROM users WHERE companyName = ?  ORDER BY employeeId DESC LIMIT 1
      `;
      db.query(getLastEmployeeQuery, [companyName], async (err, results) => {
        if (err) {
          console.error("MySQL error:", err);
          return res.status(500).json({ error: "Error fetching last employee ID" });
        }

        let newEmployeeId;
        if (results.length > 0) {
          const lastEmployeeId = results[0].employeeId;
          const prefix = lastEmployeeId.slice(0, 2);
          const number = parseInt(lastEmployeeId.slice(2)) + 1;
          newEmployeeId = `${prefix}${number.toString().padStart(3, '0')}`;
        } else {
          newEmployeeId = companyName === "Karncy" ? "KC001" : "KN001";
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const insertQuery = `INSERT INTO users 
          (firstName, lastName, email, phoneNumber, password, companyName, role, designation, department, jobLocation, dateOfBirth, bloodGroup, photo, technicalSkills, employeeId, gender, confirmPassword) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(insertQuery, 
          [firstName, lastName, email, phoneNumber, hashedPassword, companyName, role, designation, department, jobLocation, dateOfBirth, bloodGroup, photo, technicalSkills, newEmployeeId, gender, confirmPassword], 
          (err, result) => {
            if (err) {
              console.error("MySQL error:", err);
              return res.status(500).json({ error: "Failed to add user" });
            }
            res.status(201).json({ message: "User added successfully", employeeId: newEmployeeId });
          }
        );
      });
    });
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.loginUser = (req, res) => {
  const { email, password } = req.body;
  const query = "SELECT * FROM users WHERE email = ? AND `exists` = 1";
  db.query(query, [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, companyName: user.companyName },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } 
    );
    const photoUrl = user.photo ? `${req.protocol}://${req.get("host")}${user.photo}` : null;
    res.status(200).json({
      success: true,
      token,
      role: user.role,
      photo: photoUrl,
      companyName: user.companyName,
      designation: user.designation,
      phoneNumber: user.phoneNumber,
      jobLocation: user.jobLocation,
      email: user.email,
      id: user.id,
      department: user.department,
      employeeId: user.employeeId,
      firstName: user.firstName,
      lastName: user.lastName,
      technicalSkills: user.technicalSkills,
      dateOfBirth: user.dateOfBirth,
      bloodGroup:user.bloodGroup,
      gender:user.gender,
    });
  });
};

exports.updateUser = (req, res) => {
  const { id, designation, department, jobLocation, technicalSkills, phoneNumber, dateOfBirth,bloodGroup,gender } = req.body;
  const skillsString = technicalSkills ? technicalSkills.join(",") : null;

  const query = "UPDATE users SET designation=?, department=?, jobLocation=?, technicalSkills=?, phoneNumber=?, dateOfBirth=?, bloodGroup=?, gender=? WHERE id=?";
  db.query(query, [designation, department, jobLocation, skillsString, phoneNumber, dateOfBirth, bloodGroup, gender, id], (err, result) => {
      if (err) {
          console.error("Update error:", err);
          return res.status(500).json({ success: false, message: "Update failed" });
      }
      res.json({ success: true, message: "User updated successfully" });
  });
};

exports.updateUserPhoto = (req, res) => {
    const { id } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;
  
    if (!id || !photo) {
      return res.status(400).json({ success: false, message: "Invalid request." });
    }
    
    const query = `UPDATE users SET photo = ? WHERE id = ?`;
    db.query(query, [photo, id], (err, result) => {
      if (err) {
        console.error("Error updating photo:", err);
        return res.status(500).json({ success: false, message: "Failed to update photo." });
      }
      res.status(200).json({
        success: true,
        message: "Photo updated successfully.",
        photoUrl: `${req.protocol}://${req.get("host")}${photo}`,
      });
    });
};

exports.getUsers = (req, res) => {
    const { companyName, role } = req.query;

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  let query;
  const values = [companyName,];

  if (role === 'Manager') {
    query = 'SELECT * FROM users WHERE companyName = ? AND `exists` = 1'; 
  } else {
    query = `SELECT * FROM users WHERE companyName = ? AND (role = 'User' OR role = 'Manager')`;
  } 

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Error fetching users' });
    }

    const users = results.map(user => ({
      ...user,
      photo: user.photo ? `${req.protocol}://${req.get('host')}${user.photo}` : null,
      technicalSkills: user.technicalSkills ? user.technicalSkills.split(",") : null
    }));

    res.status(200).json(users);
  });
};


exports.getUsersByMonth = (req, res) => {
  const { companyName,year } = req.query;

  if (!companyName|| !year) {
    return res.status(400).json({ error: 'Company name is required' });
  }
  const query = `
    SELECT 
      MONTH(created_at) AS month,
      SUM(CASE WHEN \`exists\` = 1 THEN 1 ELSE 0 END) AS employees,
      SUM(CASE WHEN \`exists\` = 0 THEN 1 ELSE 0 END) AS deletedemployees
    FROM users
    WHERE companyName = ? AND YEAR(created_at) = ?
    GROUP BY MONTH(created_at)
  `;

  db.query(query, [companyName,year], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

exports.getUsersByLocation = (req, res) => {
  const { companyName,year } = req.query;

    if (!companyName|| !year) {
      return res.status(400).json({ error: 'Company name is required' });
    }
  
    const query = `
      SELECT jobLocation AS locationName, COUNT(*) AS locations 
      FROM users 
      WHERE companyName = ? AND \`exists\` = 1 AND YEAR(created_at) = ?
      GROUP BY jobLocation
    `;
  
    db.query(query, [companyName, year], (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    });
};

exports.getUsersByGenders = (req, res) => {
    const { companyName, year } = req.query;

    if (!companyName || !year ) {
      return res.status(400).json({ error: 'Company name is required' });
    }
  
    const query = `
      SELECT gender AS genderName, COUNT(*) AS genders 
      FROM users 
      WHERE companyName = ? AND \`exists\` = 1 AND YEAR(created_at) = ?
      GROUP BY gender
    `;
  
    db.query(query, [companyName,year], (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    });
};

exports.getUsersByDepartments = (req, res) => {
    const { companyName, year } = req.query;

    if (!companyName || !year) {
      return res.status(400).json({ error: 'Company name is required' });
    }
  
    const query = `
      SELECT department AS departmentName, COUNT(*) AS indepartment 
      FROM users 
      WHERE companyName = ? AND \`exists\` = 1 AND YEAR(created_at) = ?
      GROUP BY department
    `;
  
    db.query(query, [companyName, year], (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    });
};

exports.updateUserDetails = (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, companyName, role, gender, designation, email, phoneNumber, department, bloodGroup, technicalSkills, dateOfBirth,jobLocation} = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;
  
  const query = `UPDATE users SET firstName = ?, lastName = ?, companyName = ?, role = ?, gender = ?, designation = ?, email = ?, phoneNumber = ?, department= ?, bloodGroup = ?, technicalSkills = ?, dateOfBirth = ?, jobLocation = ?, photo = COALESCE(?, photo) WHERE id = ?`;
  const values = [firstName, lastName, companyName, role, gender,  designation, email, phoneNumber, department, bloodGroup, technicalSkills, dateOfBirth,jobLocation, photo, id];

  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: 'User updated successfully!' });
  });
};

exports.toggleUserExists = (req, res) => {
  const { id } = req.params;
  
  db.query('SELECT `exists` FROM users WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newExists = results[0].exists ? 0 : 1;
    db.query('UPDATE users SET `exists` = ? WHERE id = ?', [newExists, id], (err, result) => {
      if (err) {
        console.error('Error toggling user:', err);
        return res.status(500).json({ success: false, message: 'Failed to update user status' });
      }
      res.json({ success: true, message: 'User status updated successfully' });
    });
  });
};
