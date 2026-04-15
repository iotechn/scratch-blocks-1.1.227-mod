#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const SOURCE_DIR = path.resolve(__dirname, '..', 'media', 'extensions');
const OUTPUT_DIR = path.resolve(SOURCE_DIR, 'png');
const OUTPUT_WIDTH = 96;

const isSvgFile = fileName => fileName.toLowerCase().endsWith('.svg');

const convertSvgToPng = async fileName => {
  const sourcePath = path.join(SOURCE_DIR, fileName);
  const outputName = fileName.replace(/\.svg$/i, '.png');
  const outputPath = path.join(OUTPUT_DIR, outputName);

  await sharp(sourcePath)
      .resize({width: OUTPUT_WIDTH})
      .png({quality: 100})
      .toFile(outputPath);
};

const run = async () => {
  await fs.mkdir(OUTPUT_DIR, {recursive: true});
  const files = await fs.readdir(SOURCE_DIR);
  const svgFiles = files.filter(isSvgFile);

  if (svgFiles.length === 0) {
    console.log('No SVG files found in media/extensions.');
    return;
  }

  await Promise.all(svgFiles.map(convertSvgToPng));

  console.log(`Exported ${svgFiles.length} PNG files to ${OUTPUT_DIR}`);
};

run().catch(error => {
  console.error('Failed to export extension SVG files to PNG:', error);
  process.exit(1);
});
