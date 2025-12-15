require("dotenv").config();
const sql = require("mssql");

async function checkTableStructure() {
  console.log("🔍 Checking table structure...\n");

  try {
    const config = {
      server: process.env.DB_SERVER || "localhost",
      database: process.env.DB_DATABASE || "PMS_DB",
      user: process.env.DB_USER || "pms_app_user",
      password: process.env.DB_PASSWORD || "SecurePMS2024!",
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    };

    const pool = await sql.connect(config);
    console.log("✅ Connected to database\n");

    // Check Users table structure
    const usersColumns = await pool.request().query(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Users'
      ORDER BY ORDINAL_POSITION
    `);

    console.log("📋 Users Table Columns:");
    console.log("=======================");
    usersColumns.recordset.forEach((col) => {
      console.log(
        `${col.COLUMN_NAME} (${col.DATA_TYPE}) - Nullable: ${col.IS_NULLABLE}`
      );
    });

    console.log("\n");

    // Get sample users with available columns
    const usersResult = await pool.request().query(`
      SELECT TOP 5
        id, 
        firstName, 
        lastName, 
        email, 
        role, 
        companyId,
        CASE WHEN passwordHash IS NULL THEN 'NO PASSWORD' ELSE 'HAS PASSWORD' END as passwordStatus
      FROM dbo.Users 
      ORDER BY email
    `);

    console.log("📋 Sample Users:");
    console.log("================");
    if (usersResult.recordset.length === 0) {
      console.log("❌ No users found in database");
    } else {
      usersResult.recordset.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Company ID: ${user.companyId}`);
        console.log(`   Password: ${user.passwordStatus}`);
        console.log("");
      });
    }

    await pool.close();
    console.log("✨ Check complete!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkTableStructure();
