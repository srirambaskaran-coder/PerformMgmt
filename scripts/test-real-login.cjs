const axios = require("axios");

async function testRealLogin() {
  console.log("🔧 Testing login with real user credentials...\n");

  try {
    // Test with the actual user that exists in the database
    console.log("📡 Testing company login with real user...");
    console.log("   Email: admin@company.com");
    console.log("   Company URL: abc@abc.com");
    console.log("   Password: admin (trying common password)\n");

    const response = await axios.post(
      "http://localhost:3000/api/login/company",
      {
        companyUrl: "abc@abc.com",
        email: "admin@company.com",
        password: "admin",
      }
    );

    console.log("✅ Login succeeded!");
    console.log("📊 Response status:", response.status);
    console.log("📋 Response data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log("❌ Login failed with HTTP error:");
      console.log("📊 Status:", error.response.status);
      console.log("📋 Response:", JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 401) {
        console.log("\n🔍 Analysis:");
        if (error.response.data.message.includes("Password not set")) {
          console.log(
            "   - Password hash exists but login logic has field mapping issue"
          );
        } else if (
          error.response.data.message.includes("Invalid email or password")
        ) {
          console.log("   - Password hash exists but password is incorrect");
        } else {
          console.log("   - Different authentication issue");
        }
      }
    } else {
      console.log("❌ Network/connection error:", error.message);
      console.log("🔍 Check if server is running on http://localhost:3000");
    }
  }

  // Also test with potential correct password
  console.log("\n" + "=".repeat(50));
  console.log("🔧 Testing with different password...\n");

  try {
    const response2 = await axios.post(
      "http://localhost:3000/api/login/company",
      {
        companyUrl: "abc@abc.com",
        email: "admin@company.com",
        password: "admin123",
      }
    );

    console.log("✅ Login succeeded with admin123!");
    console.log("📊 Response status:", response2.status);
    console.log("📋 Response data:", JSON.stringify(response2.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log("❌ Login failed with admin123:");
      console.log("📊 Status:", error.response.status);
      console.log("📋 Response:", error.response.data.message);
    } else {
      console.log("❌ Network error with admin123:", error.message);
    }
  }
}

testRealLogin();
