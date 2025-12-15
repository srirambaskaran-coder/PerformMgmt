// Test MSSQL Database Connection
// Run with: node test-db-connection.js

const { readFileSync } = require("fs");
const path = require("path");

// Load environment variables from .env file
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, ".env");
    const envFile = readFileSync(envPath, "utf8");

    envFile.split("\n").forEach((line) => {
      line = line.trim();
      if (line && !line.startsWith("#") && line.includes("=")) {
        const [key, ...valueParts] = line.split("=");
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        process.env[key.trim()] = value;
      }
    });
  } catch (error) {
    console.error("Error loading .env file:", error.message);
  }
}

async function testConnection() {
  console.log("🔌 Testing MSSQL Database Connection...\n");

  // Load environment variables first
  loadEnvFile();

  // Check for required connection parameters
  const requiredParams = ["DB_SERVER", "DB_DATABASE", "DB_USER", "DB_PASSWORD"];
  const missing = requiredParams.filter((param) => !process.env[param]);

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`
    );
    console.log("\n📝 Please update your .env file with:");
    console.log("DB_SERVER=localhost");
    console.log("DB_DATABASE=your_database_name");
    console.log("DB_USER=your_username");
    console.log("DB_PASSWORD=your_password");
    return;
  }

  console.log("📋 Connection Details:");
  console.log(`   Server: ${process.env.DB_SERVER}`);
  console.log(`   Port: ${process.env.DB_PORT || "1433"}`);
  console.log(`   Database: ${process.env.DB_DATABASE}`);
  console.log(`   User: ${process.env.DB_USER}`);
  console.log(`   Password: ${"*".repeat(process.env.DB_PASSWORD.length)}`);
  console.log(`   Encrypt: ${process.env.DB_ENCRYPT || "true"}`);
  console.log(
    `   Trust Certificate: ${process.env.DB_TRUST_SERVER_CERTIFICATE || "true"}`
  );

  try {
    // Import mssql after loading env vars
    const sql = require("mssql");

    // Create config object
    const config = {
      server: process.env.DB_SERVER,
      port: parseInt(process.env.DB_PORT || "1433"),
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate:
          process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
        enableArithAbort: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    console.log("\n⏳ Connecting to database...");
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log("✅ Connection successful!");

    // Test a simple query
    console.log("\n🧪 Testing basic query...");
    const result = await pool
      .request()
      .query(
        "SELECT GETDATE() as CurrentTime, @@VERSION as SQLVersion, DB_NAME() as CurrentDB"
      );

    console.log("📊 Database Info:");
    console.log(`   Current Time: ${result.recordset[0].CurrentTime}`);
    console.log(`   Database: ${result.recordset[0].CurrentDB}`);
    console.log(
      `   SQL Version: ${result.recordset[0].SQLVersion.split("\n")[0]}`
    );

    // Test if our tables exist
    console.log("\n🔍 Checking for required tables...");
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      AND TABLE_NAME IN ('users', 'companies', 'appraisal_groups', 'evaluations', 'levels', 'grades')
      ORDER BY TABLE_NAME
    `);

    const requiredTables = [
      "users",
      "companies",
      "appraisal_groups",
      "evaluations",
      "levels",
      "grades",
    ];
    const existingTables = tablesResult.recordset.map((row) => row.TABLE_NAME);

    requiredTables.forEach((table) => {
      if (existingTables.includes(table)) {
        console.log(`   ✅ ${table} table exists`);
      } else {
        console.log(`   ❌ ${table} table missing`);
      }
    });

    // Test stored procedures
    console.log("\n🔍 Checking for stored procedures...");
    const spResult = await pool.request().query(`
      SELECT ROUTINE_NAME 
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_TYPE = 'PROCEDURE'
      AND ROUTINE_NAME IN ('GetUsers', 'CreateUser', 'GetCompanies', 'CreateCompany')
      ORDER BY ROUTINE_NAME
    `);

    const requiredSPs = [
      "GetUsers",
      "CreateUser",
      "GetCompanies",
      "CreateCompany",
    ];
    const existingSPs = spResult.recordset.map((row) => row.ROUTINE_NAME);

    requiredSPs.forEach((sp) => {
      if (existingSPs.includes(sp)) {
        console.log(`   ✅ ${sp} stored procedure exists`);
      } else {
        console.log(`   ❌ ${sp} stored procedure missing`);
      }
    });

    // Test a sample stored procedure
    console.log("\n🧪 Testing sample stored procedure...");
    try {
      const spTestResult = await pool
        .request()
        .input("CreatedById", sql.UniqueIdentifier, null)
        .execute("dbo.GetCompanies");
      console.log(
        `   ✅ GetCompanies executed successfully! Found ${spTestResult.recordset.length} companies.`
      );
    } catch (spError) {
      console.log(`   ⚠️  GetCompanies test failed: ${spError.message}`);
    }

    await pool.close();

    console.log("\n🎉 Database connection test completed successfully!");
    console.log("\n📋 Next steps:");
    console.log('   1. Run "npm run dev" to start the application');
    console.log("   2. Access frontend at http://localhost:5173");
    console.log("   3. Access backend API at http://localhost:3000");
  } catch (error) {
    console.error("\n❌ Connection failed:");
    console.error("   Error:", error.message);

    if (
      error.message.includes("Login failed") ||
      error.message.includes("authentication")
    ) {
      console.log("\n🔧 Troubleshooting - Authentication Issues:");
      console.log("   • Check username and password in DATABASE_URL");
      console.log("   • Ensure SQL Server authentication is enabled");
      console.log("   • Verify user has access to the database");
      console.log(
        "   • Try connecting with SQL Server Management Studio first"
      );
    } else if (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("timeout")
    ) {
      console.log("\n🔧 Troubleshooting - Connection Issues:");
      console.log("   • Ensure SQL Server is running");
      console.log("   • Check server name/IP address in DATABASE_URL");
      console.log("   • Verify port 1433 is accessible");
      console.log("   • Check firewall settings");
      console.log(
        "   • Ensure TCP/IP is enabled in SQL Server Configuration Manager"
      );
    } else {
      console.log("\n🔧 General Troubleshooting:");
      console.log(
        "   • Verify DATABASE_URL format: mssql://user:pass@server:port/database"
      );
      console.log(
        "   • Check if special characters in password need URL encoding"
      );
      console.log("   • Try connecting with a SQL client tool first");
    }
  }
}

testConnection().catch(console.error);
