// Execute stored procedures from SQL files
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

async function executeSqlFile(pool, filePath, fileName) {
  try {
    console.log(`\n📂 Executing ${fileName}...`);

    const sqlContent = readFileSync(filePath, "utf8");

    // Split by GO statements and filter out empty statements
    const statements = sqlContent
      .split(/\nGO\s*$/gm)
      .map((stmt) => stmt.trim())
      .filter(
        (stmt) =>
          stmt.length > 0 && !stmt.match(/^\s*--/) && !stmt.match(/^\s*USE\s+/i)
      );

    console.log(`   Found ${statements.length} SQL statements`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      try {
        await pool.request().query(statements[i]);
        successCount++;
      } catch (error) {
        errorCount++;
        if (error.message.includes("already exists")) {
          // Ignore "already exists" errors - just means it's already created
          successCount++;
          errorCount--;
        } else {
          console.log(
            `   ⚠️  Statement ${i + 1} failed: ${error.message.substring(
              0,
              100
            )}...`
          );
        }
      }
    }

    console.log(`   ✅ Success: ${successCount}, ❌ Errors: ${errorCount}`);
  } catch (error) {
    console.error(`   ❌ Failed to execute ${fileName}:`, error.message);
  }
}

async function executeAllStoredProcedures() {
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

    console.log("🚀 Executing all stored procedure files...\n");

    const pool = new sql.ConnectionPool(config);
    await pool.connect();

    // Execute in order
    const spFiles = [
      "migrations/all_stored_procedures.sql",
      "migrations/all_stored_procedures_part2.sql",
      "migrations/all_stored_procedures_part3.sql",
      "migrations/corrected_stored_procedures_part4.sql", // Use the corrected version
    ];

    for (const spFile of spFiles) {
      const fileName = path.basename(spFile);
      const filePath = path.join(__dirname, spFile);

      if (require("fs").existsSync(filePath)) {
        await executeSqlFile(pool, filePath, fileName);
      } else {
        console.log(`⚠️  File not found: ${fileName}`);
      }
    }

    // Check final count
    console.log("\n📊 Checking final stored procedure count...");
    const result = await pool.request().query(`
      SELECT COUNT(*) as sp_count 
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_TYPE = 'PROCEDURE'
    `);

    console.log(
      `✅ Total stored procedures created: ${result.recordset[0].sp_count}`
    );

    await pool.close();

    console.log("\n🎉 All stored procedures executed successfully!");
    console.log("📋 Now you can run: npm run dev");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

executeAllStoredProcedures();
