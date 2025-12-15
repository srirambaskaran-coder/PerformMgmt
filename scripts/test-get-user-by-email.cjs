require("dotenv").config();
const sql = require("mssql");

async function testGetUserByEmail() {
  console.log("🔍 Testing GetUserByEmail stored procedure...\n");

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

    // Test the stored procedure that the app is actually calling
    console.log("📡 Testing: GetUserByEmail stored procedure");
    const result = await pool
      .request()
      .input("Email", "admin@company.com")
      .execute("dbo.GetUserByEmail");

    console.log("🎯 Stored Procedure Result:");
    console.log("===========================");

    if (result.recordset.length === 0) {
      console.log("❌ No user found");
    } else {
      const user = result.recordset[0];
      console.log("Raw result from stored procedure:");
      console.log(JSON.stringify(user, null, 2));

      console.log("\n📋 Field Analysis:");
      console.log("==================");
      Object.keys(user).forEach((key) => {
        console.log(
          `${key}: ${
            user[key] === null
              ? "NULL"
              : typeof user[key] === "string"
              ? `"${user[key]}"`
              : user[key]
          }`
        );
      });

      console.log("\n🔑 Password Check:");
      console.log("==================");
      console.log(
        `password_hash field: ${user.password_hash ? "EXISTS" : "MISSING"}`
      );
      console.log(
        `passwordHash field: ${user.passwordHash ? "EXISTS" : "MISSING"}`
      );
    }

    await pool.close();
    console.log("\n✨ Test complete!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.originalError) {
      console.error("Original error:", error.originalError.message);
    }
  }
}

testGetUserByEmail();
