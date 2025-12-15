// Grant permissions to pms_app_user
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

async function grantPermissions() {
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

    console.log("🔧 Granting permissions to pms_app_user...\n");

    const pool = new sql.ConnectionPool(config);
    await pool.connect();

    // Grant execute permissions on all stored procedures
    try {
      await pool.request().query(`
        GRANT EXECUTE ON SCHEMA::dbo TO pms_app_user;
      `);
      console.log("✅ Execute permissions granted on schema dbo");
    } catch (error) {
      console.log("⚠️  Schema permission failed:", error.message);
    }

    // Grant data permissions
    try {
      await pool.request().query(`
        ALTER ROLE db_datareader ADD MEMBER pms_app_user;
        ALTER ROLE db_datawriter ADD MEMBER pms_app_user;
      `);
      console.log("✅ Data read/write permissions granted");
    } catch (error) {
      console.log("⚠️  Data permission failed:", error.message);
    }

    // Test a stored procedure
    console.log("\n🧪 Testing stored procedure access...");
    try {
      const result = await pool
        .request()
        .input("CreatedById", sql.UniqueIdentifier, null)
        .execute("dbo.GetCompanies");
      console.log(
        `✅ GetCompanies executed successfully! Found ${result.recordset.length} companies`
      );
    } catch (error) {
      console.log(`❌ GetCompanies test failed: ${error.message}`);
    }

    // Test another SP
    try {
      const result2 = await pool
        .request()
        .input("CreatedById", sql.UniqueIdentifier, null)
        .execute("dbo.GetUsers");
      console.log(
        `✅ GetUsers executed successfully! Found ${result2.recordset.length} users`
      );
    } catch (error) {
      console.log(`❌ GetUsers test failed: ${error.message}`);
    }

    await pool.close();

    console.log("\n🎉 Permission setup completed!");
    console.log("📋 Your application should now work. Run: npm run dev");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

grantPermissions();
