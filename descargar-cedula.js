import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const CEDULA_WIDTH = 2700;
const CEDULA_HEIGHT = 2931;
const OUTPUT_PNG = 'cedula.png';
const OUTPUT_PDF = 'cedula.pdf';

console.log('Iniciando descarga de cédula de votabien.pe...');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Viewport grande para que la página renderice bien
await page.setViewportSize({ width: 3200, height: 3500 });

console.log('Navegando a https://votabien.pe/ ...');
await page.goto('https://votabien.pe/', { waitUntil: 'domcontentloaded', timeout: 60000 });

// Esperar a que la React app inicialice (botón de inicio)
console.log('Esperando pantalla de inicio...');
await page.waitForSelector('button.sigma-btn', { state: 'visible', timeout: 30000 });

// Hacer click en "¡Practica ahora!" para entrar al simulador
console.log('Haciendo click en "¡Practica ahora!"...');
await page.click('button.sigma-btn');

// Cerrar todos los modales/tutoriales que aparezcan (CÓMO VOTAR, NAVEGACIÓN, etc.)
// Cada uno tiene un botón "SALTAR" - los cerramos en bucle hasta que no quede ninguno
console.log('Cerrando modales de tutorial...');
for (let i = 0; i < 5; i++) {
  try {
    const saltarBtn = await page.waitForSelector('button:has-text("SALTAR")', { state: 'visible', timeout: 3000 });
    console.log(`  Saltando modal ${i + 1}...`);
    await saltarBtn.click();
    await page.waitForTimeout(800);
  } catch {
    break; // No hay más modales
  }
}

// Esperar a que la cédula aparezca en el DOM
console.log('Esperando que cargue la cédula...');
await page.waitForSelector('.cedula-pattern', { state: 'attached', timeout: 30000 });

// Esperar a que las imágenes de candidatos carguen (S3)
console.log('Esperando imágenes de candidatos...');
await page.waitForLoadState('networkidle', { timeout: 60000 });

// Remover el transform/scale y posicionamiento absoluto del elemento cédula
// para que se renderice a su tamaño real (2700x2931)
console.log('Ajustando estilos para captura en tamaño completo...');
await page.evaluate(({ w, h }) => {
  const cedula = document.querySelector('.cedula-pattern');
  if (!cedula) throw new Error('No se encontró el elemento .cedula-pattern');

  // Resetear transform y position del elemento principal
  cedula.style.transform = 'none';
  cedula.style.position = 'relative';
  cedula.style.top = '0';
  cedula.style.left = '0';
  cedula.style.width = w + 'px';
  cedula.style.height = h + 'px';

  // Hacer que el contenedor padre no recorte el contenido
  let parent = cedula.parentElement;
  while (parent && parent !== document.body) {
    parent.style.overflow = 'visible';
    parent.style.width = w + 'px';
    parent.style.height = h + 'px';
    parent.style.position = 'relative';
    parent.style.transform = 'none';
    parent = parent.parentElement;
  }

  // Limpiar el body/html para que solo muestre la cédula
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'visible';
  document.body.style.background = 'white';
  document.documentElement.style.overflow = 'visible';
}, { w: CEDULA_WIDTH, h: CEDULA_HEIGHT });

// Pequeña pausa para que se re-renderice
await page.waitForTimeout(1000);

// Capturar screenshot del elemento a tamaño completo
console.log(`Capturando PNG (${CEDULA_WIDTH}x${CEDULA_HEIGHT}px)...`);
const cedulaEl = await page.$('.cedula-pattern');
const pngBuffer = await cedulaEl.screenshot({
  type: 'png',
  timeout: 30000,
});
writeFileSync(OUTPUT_PNG, pngBuffer);
console.log(`✓ PNG guardado: ${resolve(OUTPUT_PNG)}`);

// Generar PDF ajustado al tamaño de la cédula
console.log('Generando PDF...');

// Ajustar viewport para el PDF
await page.setViewportSize({ width: CEDULA_WIDTH, height: CEDULA_HEIGHT });

const pdfBuffer = await page.pdf({
  width: CEDULA_WIDTH + 'px',
  height: CEDULA_HEIGHT + 'px',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
});
writeFileSync(OUTPUT_PDF, pdfBuffer);
console.log(`✓ PDF guardado: ${resolve(OUTPUT_PDF)}`);

await browser.close();
console.log('\n¡Listo! Archivos generados:');
console.log(`  - ${OUTPUT_PNG}`);
console.log(`  - ${OUTPUT_PDF}`);
