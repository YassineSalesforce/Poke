const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function convertExcelDate(excelDate) {
  if (!excelDate || excelDate === 0) return null;
  
  try {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    
    if (isNaN(date.getTime())) return null;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erreur conversion date:', error);
    return null;
  }
}

const excelFilePath = path.join(__dirname, '../src/data/Zones de fret.xlsx');
const outputPath = path.join(__dirname, '../src/data/zones-de-fret-complet.json');

console.log('🔄 Conversion du fichier Excel en JSON avec dates formatées...');
console.log('📁 Fichier source:', excelFilePath);
console.log('📁 Fichier de sortie:', outputPath);

try {
  if (!fs.existsSync(excelFilePath)) {
    console.error('❌ Le fichier Excel n\'existe pas:', excelFilePath);
    process.exit(1);
  }

  const workbook = XLSX.readFile(excelFilePath);
  
  const sheetName = workbook.SheetNames[0];
  console.log('📋 Feuille trouvée:', sheetName);
  
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`✅ ${jsonData.length} lignes converties`);
  
  const processedData = jsonData.map((item, index) => {
    const processedItem = { ...item };
    
    if (item['Date']) {
      processedItem['Date'] = convertExcelDate(item['Date']);
    }
    
    return processedItem;
  });
  
  if (processedData.length > 0) {
    console.log('📊 Échantillon des données:');
    console.log('Colonnes disponibles:', Object.keys(processedData[0]));
    console.log('Première ligne:', processedData[0]);
    
    console.log('\n📅 Exemples de dates converties:');
    processedData.slice(0, 5).forEach((item, index) => {
      if (item['Date']) {
        console.log(`  ${index + 1}. ${item['Transporteur']}: ${item['Date']}`);
      }
    });
  }
  
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
  
  console.log('✅ Conversion terminée avec succès!');
  console.log(`📄 Fichier JSON créé: ${outputPath}`);
  console.log(`📊 ${processedData.length} transporteurs disponibles`);
  console.log('📅 Dates converties au format DD/MM/YYYY');
  
} catch (error) {
  console.error('❌ Erreur lors de la conversion:', error.message);
  process.exit(1);
}
