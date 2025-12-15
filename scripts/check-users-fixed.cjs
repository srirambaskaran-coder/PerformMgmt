require("dotenv").config();
const sql = require("mssql");

async function checkUsersFixed() {
  console.log("🔍 Checking existing users with correct column names...\n");

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

    // Check existing users with correct column names
    const usersResult = await pool.request().query(`
      SELECT 
        id, 
        first_name, 
        last_name, 
        email, 
        role, 
        company_id,
        CASE WHEN password_hash IS NULL THEN 'NO PASSWORD' ELSE 'HAS PASSWORD' END as passwordStatus,
        status
      FROM dbo.Users 
      ORDER BY email
    `);

    console.log("📋 Current Users:");
    console.log("================");
    if (usersResult.recordset.length === 0) {
      console.log("❌ No users found in database");
    } else {
      usersResult.recordset.forEach((user, index) => {
        console.log(`${index + 1}. ${user.first_name} ${user.last_name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Company ID: ${user.company_id}`);
        console.log(`   Password: ${user.passwordStatus}`);
        console.log(`   Status: ${user.status}`);
        console.log("");
      });
    }

    // Check existing companies
    const companiesResult = await pool.request().query(`
      SELECT id, company_name, company_url 
      FROM dbo.Companies 
      ORDER BY company_name
    `);

    console.log("🏢 Current Companies:");
    console.log("====================");
    if (companiesResult.recordset.length === 0) {
      console.log("❌ No companies found in database");
    } else {
      companiesResult.recordset.forEach((company, index) => {
        console.log(`${index + 1}. ${company.company_name}`);
        console.log(`   URL: ${company.company_url}`);
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

checkUsersFixed();
