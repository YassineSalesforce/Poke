const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('🔄 Conversion du fichier Excel "liste mission transport.xlsx" en JSON...');

try {
  // Chemin vers le fichier Excel
  const excelFilePath = path.join(__dirname, '../src/data/Liste Missions Transports.xlsx');
  
  // Vérifier si le fichier existe
  if (!fs.existsSync(excelFilePath)) {
    console.error('❌ Fichier "liste mission transport.xlsx" non trouvé dans le répertoire racine');
    process.exit(1);
  }

  // Lire le fichier Excel
  const workbook = XLSX.readFile(excelFilePath);
  const sheetName = workbook.SheetNames[0]; // Prendre la première feuille
  const worksheet = workbook.Sheets[sheetName];

  // Convertir en JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 ${jsonData.length} missions trouvées dans le fichier Excel`);

  // Chemin de sortie
  const outputPath = path.join(__dirname, '../src/data/liste-mission-transport.json');

  // Écrire le fichier JSON
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf8');

  console.log(`✅ Conversion terminée ! Fichier créé : ${outputPath}`);
  console.log(`📋 Colonnes trouvées :`, Object.keys(jsonData[0] || {}));

} catch (error) {
  console.error('❌ Erreur lors de la conversion :', error);
  process.exit(1);
}
