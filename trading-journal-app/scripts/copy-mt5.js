const fs = require("fs");
const path = require("path");

// Crear directorio de destino si no existe
const destDir = path.join(__dirname, "..", "dist", "main", "mt5-integration");
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log("Created directory:", destDir);
}

// Copiar archivos .py
const sourceDir = path.join(__dirname, "..", "main", "mt5-integration");
const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith(".py"));

files.forEach((file) => {
  const source = path.join(sourceDir, file);
  const dest = path.join(destDir, file);

  try {
    fs.copyFileSync(source, dest);
    console.log(`Copied: ${file}`);
  } catch (error) {
    console.error(`Error copying ${file}:`, error.message);
  }
});

console.log("MT5 files copy completed!");
