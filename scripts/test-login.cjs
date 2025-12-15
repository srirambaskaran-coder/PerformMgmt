const axios = require("axios");

async function testLogin() {
  console.log("🔧 Testing login functionality after SQL type fixes...\n");

  try {
    // Test company login endpoint
    console.log("📡 Testing company login...");
    const response = await axios.post(
      "http://localhost:3000/api/company-login",
      {
        companyName: "TestCompany",
        username: "admin",
        password: "admin123",
      }
    );

    console.log("✅ Login request succeeded!");
    console.log("📊 Response status:", response.status);
    console.log("📋 Response data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log("❌ Login failed with HTTP error:");
      console.log("📊 Status:", error.response.status);
      console.log("📋 Response:", JSON.stringify(error.response.data, null, 2));

      // Check if it's a SQL type error
      if (error.response.data?.message?.includes("sql.NVarChar")) {
        console.log("🔴 SQL type error still present! Check storage.ts file.");
      } else if (error.response.status === 401) {
        console.log(
          "✅ SQL types fixed! Error is authentication-related (expected for test credentials)."
        );
      } else {
        console.log("⚠️ Different error type - may need investigation.");
      }
    } else {
      console.log("❌ Network/connection error:", error.message);
      console.log("🔍 Check if server is running on http://localhost:3000");
    }
  }
}

// Test both endpoints
async function runTests() {
  console.log("🚀 Starting SQL Type Fix Validation\n");
  console.log("=".repeat(50));

  await testLogin();

  console.log("\n" + "=".repeat(50));
  console.log("✨ Test complete! Check results above.");
}

runTests();
