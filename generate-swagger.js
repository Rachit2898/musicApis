const fs = require("fs");
const path = require("path");
const { swaggerSpec } = require("./swagger");

const outputDir = path.join(__dirname, "swagger");
const outputPath = path.join(outputDir, "swagger-output.json");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
console.log("✅ Swagger JSON generated at", outputPath);
