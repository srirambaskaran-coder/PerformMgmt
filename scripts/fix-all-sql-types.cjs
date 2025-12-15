// Advanced fix for all SQL type issues
const fs = require("fs");
const path = require("path");

function fixAllSqlTypes() {
  const filePath = path.join(__dirname, "server", "storage.ts");

  try {
    let content = fs.readFileSync(filePath, "utf8");

    console.log("🔧 Removing all SQL type specifications...");

    // Replace .input() calls with SQL types
    let fixCount = 0;
    content = content.replace(
      /\.input\(([^,]+),\s*sql\.[^,]+,\s*([^)]+)\)/g,
      (match, param, value) => {
        fixCount++;
        return `.input(${param}, ${value})`;
      }
    );

    console.log(`✅ Fixed ${fixCount} .input() calls`);

    // Write the fixed content back
    fs.writeFileSync(filePath, content, "utf8");

    console.log("📄 File updated: server/storage.ts");
    console.log("🎉 All SQL type issues should now be resolved!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

fixAllSqlTypes();
