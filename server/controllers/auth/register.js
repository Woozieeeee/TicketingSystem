// server/controllers/auth/register.js
const User = require("../../models/user");
const Notification = require("../../models/notification"); // 1. ETO ANG DAGDAG: I-import ang Notification Model

/**
 * Register a new user
 * POST /api/auth/register
 */
module.exports = async (req, res) => {
  try {
    const { username, password, dept } = req.body;

    // Validate required fields
    if (!username || !password || !dept) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Clean department name to prevent duplicates
    const cleanDept = dept.trim().toUpperCase();

    // Check if this is the first user for this department
    const deptUserCount = await User.countByDept(cleanDept);
    const assignedRole = deptUserCount === 0 ? "Head" : "User";

    // Generate unique user ID
    const id = `u_${Date.now()}`;

    // Create user in database
    await User.create({
      id,
      username,
      password,
      role: assignedRole,
      dept: cleanDept,
    });

    console.log(`✅ User ${username} registered as ${assignedRole} for ${cleanDept}`);

    // 2. ETO ANG BAGONG LOGIC PARA SA NOTIFICATION
    // Magpapadala ng notif sa Head para sa LAHAT ng bagong registration (Head o User)
    try {
      console.log(`🔍 Debug: Looking for heads in department: ${cleanDept}`);
      // Hinahanap natin ang username ng Head ng departamentong ito
      const deptHeads = await User.findHeadsByDept(cleanDept);
      console.log(`🔍 Debug: Found heads:`, deptHeads);
      
      // Kung may nahanap na Head ang system, padadalhan siya ng notification row
      if (deptHeads && deptHeads.length > 0) {
        const message = `System Alert: A new user "${username}" has registered under your department (${cleanDept}) as ${assignedRole}.`;
        
        // I-loop ang lahat ng Heads sa dept na yun (kung sakaling higit sa isa sila)
        for (const head of deptHeads) {
          console.log(`🔍 Debug: Creating notification for head: ${head.username}`);
          await Notification.create({
            username: head.username, // Ang makakatanggap: Ang Department Head
            message: message,        // Ang mensahe ng system alert
            ticketGlobalId: null,    // Null dahil hindi naman ito tungkol sa ticket
            type: "new_user",        // Uri ng notification para sa madaling pag-filter sa frontend
          });
        }
        console.log(`🔔 Registration Notification sent to ${cleanDept} Head(s)`);
      } else {
        console.log(`⚠️ No heads found for department: ${cleanDept}`);
      }
    } catch (notifErr) {
      // Gagamit tayo ng 'Fire-and-Forget' approach. 
      // Kung sakaling magka-error ang notification, hindi nito haharangin o ititigil ang tagumpay na registration ng user.
      console.error("⚠️ Non-blocking Notification Error:", notifErr.message);
      console.error("⚠️ Full error:", notifErr);
    }

    return res.status(201).json({
      success: true,
      role: assignedRole,
      dept: cleanDept,
    });
  } catch (error) {
    console.error("❌ Registration Error:", error.message);
    return res.status(500).json({
      error: "Registration failed",
      message: error.message,
    });
  }
};