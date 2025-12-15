require("dotenv").config();
const sql = require("mssql");

async function checkCompaniesStructure() {
  console.log("🔍 Checking Companies table structure...\n");

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

    // Check Companies table structure
    const companiesColumns = await pool.request().query(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Companies'
      ORDER BY ORDINAL_POSITION
    `);

    console.log("📋 Companies Table Columns:");
    console.log("===========================");
    companiesColumns.recordset.forEach((col) => {
      console.log(
        `${col.COLUMN_NAME} (${col.DATA_TYPE}) - Nullable: ${col.IS_NULLABLE}`
      );
    });

    console.log("\n");

    // Get sample companies with available columns
    const companiesResult = await pool.request().query(`
      SELECT TOP 5 * FROM dbo.Companies
    `);

    console.log("📋 Sample Companies:");
    console.log("===================");
    if (companiesResult.recordset.length === 0) {
      console.log("❌ No companies found in database");
    } else {
      companiesResult.recordset.forEach((company, index) => {
        console.log(`${index + 1}. Company Record:`);
        Object.keys(company).forEach((key) => {
          console.log(`   ${key}: ${company[key]}`);
        });
        console.log("");
      });
    }

    await pool.close();
    console.log("✨ Check complete!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkCompaniesStructure();
