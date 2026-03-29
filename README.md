# Cédula de Votación — Elecciones Generales Perú 2026

Descarga automática de la cédula de votación del simulador [votabien.pe](https://votabien.pe/) en formato PNG y PDF, lista para imprimir o compartir.

## ¿Qué hace este proyecto?

El sitio **votabien.pe** (de la Asociación Civil Transparencia) ofrece un simulador interactivo de la cédula para las Elecciones Generales del 12 de abril de 2026. Sin embargo, no tiene un botón de descarga directa.

Este script automatiza el proceso:

1. Abre el simulador en un navegador invisible (headless)
2. Navega por las pantallas de inicio y cierra los tutoriales automáticamente
3. Extrae el elemento HTML de la cédula y elimina el zoom con el que se muestra en pantalla
4. Lo captura a su **tamaño real (2700 × 2931 px)**
5. Guarda la cédula como **PNG** y como **PDF**

```
votabien.pe  →  [Playwright]  →  cedula.png
                               →  cedula.pdf
```

## La cédula

La cédula es válida para **Lima Metropolitana** y contiene 5 secciones:

| Sección | Tipo de elección |
|---|---|
| Presidente y Vicepresidentes | Marca al candidato de tu preferencia |
| Senadores – Distrito Único | Nacional, con voto preferencial (1 o 2 números) |
| Senadores – Distrito Múltiple | Regional, con voto preferencial |
| Diputados | Con voto preferencial (1 o 2 números) |
| Parlamento Andino | Con voto preferencial |

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/2026-elecciones-generales-peru-cedula.git
cd 2026-elecciones-generales-peru-cedula

# 2. Instalar dependencias
npm install

# 3. Descargar el navegador Chromium para Playwright
npx playwright install chromium
```

## Uso

```bash
node descargar-cedula.js
```

El script imprime el progreso en consola:

```
Iniciando descarga de cédula de votabien.pe...
Navegando a https://votabien.pe/ ...
Esperando pantalla de inicio...
Haciendo click en "¡Practica ahora!"...
Cerrando modales de tutorial...
  Saltando modal 1...
  Saltando modal 2...
Esperando que cargue la cédula...
Esperando imágenes de candidatos...
Ajustando estilos para captura en tamaño completo...
Capturando PNG (2700x2931px)...
✓ PNG guardado: /ruta/al/proyecto/cedula.png
Generando PDF...
✓ PDF guardado: /ruta/al/proyecto/cedula.pdf

¡Listo! Archivos generados:
  - cedula.png
  - cedula.pdf
```

## Archivos generados

| Archivo | Tamaño aprox. | Descripción |
|---|---|---|
| `cedula.png` | ~1.8 MB | Imagen PNG a 2700 × 2931 px |
| `cedula.pdf` | ~7.3 MB | PDF imprimible con fondo incluido |

## ¿Cómo funciona internamente?

### 1. Automatización del navegador (Playwright)

[Playwright](https://playwright.dev/) es una librería que permite controlar un navegador web desde código. Aquí se usa Chromium en modo *headless* (sin ventana visible).

```js
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
```

### 2. Navegación por la app React

El simulador es una aplicación React que tiene un flujo de pantallas:

```
Pantalla de inicio  →  Tutorial "CÓMO VOTAR"  →  Modal "NAVEGACIÓN"  →  Cédula
```

El script hace click en los botones correspondientes para avanzar:

```js
await page.click('button.sigma-btn');          // "¡Practica ahora!"
await page.click('button:has-text("SALTAR")'); // Cerrar tutoriales
```

### 3. Extracción a tamaño real

La cédula en el sitio se muestra reducida al ~22% con un `transform: scale(0.22)` de CSS. El script la restaura a su tamaño original antes de capturar:

```js
cedula.style.transform = 'none';
cedula.style.width = '2700px';
cedula.style.height = '2931px';
```

### 4. Captura

- **PNG**: se captura directamente el elemento HTML `.cedula-pattern`
- **PDF**: se genera con `page.pdf()` ajustando el tamaño de página exacto

## Tecnologías

- **[Playwright](https://playwright.dev/)** — automatización de navegadores
- **Node.js** — entorno de ejecución
- **Chromium** — navegador usado para renderizar el sitio

## Fuente de datos

Las imágenes de símbolos y fotografías de candidatos provienen del bucket S3 del simulador:

```
https://simulador-voto-sabana.s3.us-east-1.amazonaws.com/candidatos2026/
```

El simulador es desarrollado por [PLAZACIVICA.PE](https://plazacivica.pe/) para la [Asociación Civil Transparencia](https://transparencia.org.pe/).
