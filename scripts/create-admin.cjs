// Create admin user script
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

async function createAdminUser() {
  loadEnvFile();

  try {
    const sql = require("mssql");
    const bcrypt = require("bcrypt");

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

    console.log("🔧 Creating admin user...\n");

    const pool = new sql.ConnectionPool(config);
    await pool.connect();

    // Admin user details
    const adminData = {
      email: "admin@company.com",
      password: "Admin123!",
      firstName: "System",
      lastName: "Administrator",
      role: "super_admin",
      code: "ADMIN001",
    };

    // Hash the password
    const passwordHash = await bcrypt.hash(adminData.password, 10);

    console.log("📋 Admin User Details:");
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log(`   Role: ${adminData.role}`);
    console.log(`   Code: ${adminData.code}`);

    // Create the user
    const result = await pool
      .request()
      .input("Email", adminData.email)
      .input("FirstName", adminData.firstName)
      .input("LastName", adminData.lastName)
      .input("Role", adminData.role)
      .input("Status", "active")
      .input("Code", adminData.code)
      .input("PasswordHash", passwordHash)
      .execute("dbo.CreateUser");

    if (result.recordset && result.recordset.length > 0) {
      console.log("\n✅ Admin user created successfully!");
      console.log(`   User ID: ${result.recordset[0].Id}`);

      // Create a company for the admin
      console.log("\n🏢 Creating default company...");
      const companyResult = await pool
        .request()
        .input("Name", "Default Company")
        .input("Email", "info@company.com")
        .input("Status", "active")
        .execute("dbo.CreateCompany");

      if (companyResult.recordset && companyResult.recordset.length > 0) {
        console.log("✅ Default company created!");
        console.log(`   Company ID: ${companyResult.recordset[0].Id}`);

        // Update user with company ID
        await pool
          .request()
          .input("Id", result.recordset[0].Id)
          .input("CompanyId", companyResult.recordset[0].Id)
          .execute("dbo.UpdateUser");

        console.log("✅ User linked to company!");
      }
    } else {
      console.log("⚠️  User creation failed - no result returned");
    }

    await pool.close();

    console.log("\n🎉 Setup completed!");
    console.log("\n📋 Login Instructions:");
    console.log("   1. Go to http://localhost:3000");
    console.log("   2. Use these credentials:");
    console.log(`      Email: ${adminData.email}`);
    console.log(`      Password: ${adminData.password}`);
    console.log("   3. You can now create more users from the admin panel");
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);

    if (error.message.includes("duplicate key")) {
      console.log("\n💡 User might already exist. Try these credentials:");
      console.log("   Email: admin@company.com");
      console.log("   Password: Admin123!");
    }
  }
}

createAdminUser();
