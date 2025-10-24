const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('🔄 Conversion du fichier Excel "liste mission transport.xlsx" en JSON...');

try {
  const excelFilePath = path.join(__dirname, '../src/data/Liste Missions Transports.xlsx');
  
  if (!fs.existsSync(excelFilePath)) {
    console.error('❌ Fichier "liste mission transport.xlsx" non trouvé dans le répertoire racine');
    process.exit(1);
  }

  const workbook = XLSX.readFile(excelFilePath);
  const sheetName = workbook.SheetNames[0]; 
  const worksheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 ${jsonData.length} missions trouvées dans le fichier Excel`);

  const outputPath = path.join(__dirname, '../src/data/liste-mission-transport.json');

  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf8');

  console.log(`✅ Conversion terminée ! Fichier créé : ${outputPath}`);
  console.log(`📋 Colonnes trouvées :`, Object.keys(jsonData[0] || {}));

} catch (error) {
  console.error('❌ Erreur lors de la conversion :', error);
  process.exit(1);
}
