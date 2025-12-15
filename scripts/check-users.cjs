require("dotenv").config();
const sql = require("mssql");

async function checkUsers() {
  console.log("🔍 Checking existing users in database...\n");

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

    // Check existing users
    const usersResult = await pool.request().query(`
      SELECT 
        id, 
        firstName, 
        lastName, 
        email, 
        role, 
        companyId,
        CASE WHEN passwordHash IS NULL THEN 'NO PASSWORD' ELSE 'HAS PASSWORD' END as passwordStatus,
        isActive
      FROM dbo.Users 
      ORDER BY email
    `);

    console.log("📋 Current Users:");
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
        console.log(`   Active: ${user.isActive ? "YES" : "NO"}`);
        console.log("");
      });
    }

    // Check existing companies
    const companiesResult = await pool.request().query(`
      SELECT id, companyName, companyUrl 
      FROM dbo.Companies 
      ORDER BY companyName
    `);

    console.log("🏢 Current Companies:");
    console.log("====================");
    if (companiesResult.recordset.length === 0) {
      console.log("❌ No companies found in database");
    } else {
      companiesResult.recordset.forEach((company, index) => {
        console.log(`${index + 1}. ${company.companyName}`);
        console.log(`   URL: ${company.companyUrl}`);
        console.log(`   ID: ${company.id}`);
        console.log("");
      });
    }

    await pool.close();
    console.log("✨ Database check complete!");
  } catch (error) {
    console.error("❌ Database error:", error.message);
  }
}

checkUsers();
