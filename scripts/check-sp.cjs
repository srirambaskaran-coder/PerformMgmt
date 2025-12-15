// Quick stored procedure check
const { readFileSync } = require("fs");
const path = require("path");

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

async function checkStoredProcedures() {
  loadEnvFile();

  try {
    const sql = require("mssql");

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
    };

    console.log("🔍 Checking all stored procedures in database...\n");

    const pool = new sql.ConnectionPool(config);
    await pool.connect();

    // Get all stored procedures
    const result = await pool.request().query(`
      SELECT 
        ROUTINE_NAME,
        ROUTINE_DEFINITION
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_TYPE = 'PROCEDURE'
      ORDER BY ROUTINE_NAME
    `);

    console.log(`📊 Found ${result.recordset.length} stored procedures:`);
    result.recordset.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.ROUTINE_NAME}`);
    });

    // Grant permissions to user
    console.log("\n🔧 Granting execute permissions to pms_app_user...");

    try {
      await pool.request().query(`
        GRANT EXECUTE ON SCHEMA::dbo TO pms_app_user;
      `);
      console.log("✅ Execute permissions granted successfully!");
    } catch (permError) {
      console.log(
        "⚠️  Permission grant failed (you may need admin rights):",
        permError.message
      );
      console.log("\n📝 Run this as admin in SSMS:");
      console.log("   GRANT EXECUTE ON SCHEMA::dbo TO pms_app_user;");
    }

    await pool.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkStoredProcedures();
