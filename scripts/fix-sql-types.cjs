// Fix all SQL type issues in storage.ts
const fs = require("fs");
const path = require("path");

function fixSqlTypes() {
  const filePath = path.join(__dirname, "server", "storage.ts");

  try {
    let content = fs.readFileSync(filePath, "utf8");

    console.log("🔧 Fixing SQL type references...");

    // Remove SQL type specifications - let MSSQL infer types
    const patterns = [
      // Fix .input calls with SQL types
      {
        pattern:
          /\.input\(([^,]+),\s*sql\.(UniqueIdentifier|NVarChar\([^)]*\)|Int|Bit|DateTime2|MAX)\s*,\s*([^)]+)\)/g,
        replacement: ".input($1, $3)",
      },
      // Fix any remaining sql.MAX references
      {
        pattern: /sql\.MAX/g,
        replacement: "undefined",
      },
    ];

    patterns.forEach((fix, index) => {
      const matches = content.match(fix.pattern);
      if (matches) {
        console.log(`   Pattern ${index + 1}: Found ${matches.length} matches`);
        content = content.replace(fix.pattern, fix.replacement);
      } else {
        console.log(`   Pattern ${index + 1}: No matches found`);
      }
    });

    // Write the fixed content back
    fs.writeFileSync(filePath, content, "utf8");

    console.log("✅ SQL type references fixed successfully!");
    console.log("📄 File updated: server/storage.ts");
  } catch (error) {
    console.error("❌ Error fixing SQL types:", error.message);
  }
}

fixSqlTypes();
