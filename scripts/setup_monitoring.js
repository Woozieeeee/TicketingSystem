const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Update with your MySQL password
  database: 'ticketingsystem'
};

async function setupMonitoringTables() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📁 Reading monitoring schema file...');
    const schemaPath = path.join(__dirname, '../database_monitoring_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('⚡ Executing monitoring schema...');
    
    // Split the SQL file by semicolons and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('🔨 Executing:', statement.substring(0, 50) + '...');
        await connection.execute(statement);
      }
    }
    
    console.log('✅ Monitoring tables created successfully!');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const [tables] = await connection.execute("SHOW TABLES LIKE 'activity_logs'");
    const [alerts] = await connection.execute("SHOW TABLES LIKE 'system_alerts'");
    const [sessions] = await connection.execute("SHOW TABLES LIKE 'user_sessions'");
    
    console.log('📊 Created tables:');
    console.log(`   - activity_logs: ${tables.length > 0 ? '✅' : '❌'}`);
    console.log(`   - system_alerts: ${alerts.length > 0 ? '✅' : '❌'}`);
    console.log(`   - user_sessions: ${sessions.length > 0 ? '✅' : '❌'}`);
    
    // Insert some sample data if tables are empty
    const [activityCount] = await connection.execute('SELECT COUNT(*) as count FROM activity_logs');
    
    if (activityCount[0].count === 0) {
      console.log('📝 Inserting sample monitoring data...');
      
      // Sample activity logs
      await connection.execute(`
        INSERT INTO activity_logs (username, action, resource, details, ip_address, role) VALUES
        ('admin', 'LOGIN_SUCCESS', 'AUTH', '{"success": true, "timestamp": "' + new Date().toISOString() + '"}', '127.0.0.1', 'Admin'),
        ('admin', 'USER_MANAGEMENT', 'USER', '{"action": "view_users", "count": 5}', '127.0.0.1', 'Admin'),
        ('admin', 'TICKET_VIEW', 'TICKET', '{"action": "view_dashboard", "total_tickets": 10}', '127.0.0.1', 'Admin')
      `);
      
      // Sample system alerts
      await connection.execute(`
        INSERT INTO system_alerts (type, severity, message, details, username) VALUES
        ('SYSTEM_EVENT', 'LOW', 'Monitoring system initialized', '{"status": "active", "tables_created": 6}', 'system'),
        ('SECURITY_EVENT', 'MEDIUM', 'Admin login detected', '{"username": "admin", "ip": "127.0.0.1"}', 'admin')
      `);
      
      console.log('✅ Sample data inserted successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error setting up monitoring tables:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Tip: Check your MySQL credentials and permissions');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Tip: Make sure the "ticketingsystem" database exists');
    }
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup
if (require.main === module) {
  setupMonitoringTables()
    .then(() => {
      console.log('🎉 Monitoring setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { setupMonitoringTables };
