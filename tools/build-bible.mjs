#!/usr/bin/env node
/**
 * Rebuild the design workbook from data/bible.json with @oai/artifact-tool.
 * Run with the Codex primary Node runtime from an OS temporary directory whose
 * node_modules points to CODEX_PRIMARY_RUNTIME_NODE_MODULES. The launcher below
 * resolves that package directly when this script remains in the repository.
 * Usage: "$CODEX_PRIMARY_RUNTIME_NODE" tools/build-bible.mjs [repoRoot] [outputDir]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const repoRoot = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const outputDir = path.resolve(process.argv[3] || path.join(repoRoot, '..', 'outputs', 'imperium-march'));
const receiptSuffix = process.env.BIBLE_RECEIPT_SUFFIX || '';
if (receiptSuffix && !/^[a-z0-9][a-z0-9-]*$/.test(receiptSuffix)) throw new Error('Invalid BIBLE_RECEIPT_SUFFIX');
const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if (!runtimeModules) throw new Error('CODEX_PRIMARY_RUNTIME_NODE_MODULES is required. Use the Codex primary runtime.');
const workingDir = await fs.mkdtemp(path.join(os.tmpdir(), 'imperium-bible-'));
await fs.symlink(runtimeModules, path.join(workingDir, 'node_modules'), 'dir');
process.chdir(workingDir);
const runtimeRequire = createRequire(path.join(workingDir, 'entry.mjs'));
const { Workbook, SpreadsheetFile } = await import(pathToFileURL(runtimeRequire.resolve('@oai/artifact-tool')).href);

const source = JSON.parse(await fs.readFile(path.join(repoRoot, 'data', 'bible.json'), 'utf8'));
if (!Array.isArray(source.sheets) || source.sheets.length === 0) throw new Error('No design sheets in bible.json');
const colors = { ink: '#172C36', sand: '#F4F0E8', copper: '#A65F3F', paper: '#FFFFFF', pale: '#F8F6F0', muted: '#61717A', line: '#DCDDD7', design: '#E9EEF2', proto: '#FBE8C7', todo: '#F4D8D0', done: '#E2EDE4' };
const statuses = ['Conçu', 'Prototype', 'À produire', 'Vérifié'];
const statusStyles = [
  { fill: colors.design, font: { color: '#314F65' } },
  { fill: colors.proto, font: { color: '#7D511D', bold: true } },
  { fill: colors.todo, font: { color: '#8A3B2C' } },
  { fill: colors.done, font: { color: '#2E6445' } },
];
const workbook = Workbook.create();
const summary = workbook.worksheets.add('Synthèse');
summary.tabColor = colors.ink;
const sheetRecords = source.sheets.map((spec, i) => ({ spec, sheet: workbook.worksheets.add(spec.name), index: i }));
const col = n => { let result = ''; for (let v = n + 1; v > 0; v = Math.floor((v - 1) / 26)) result = String.fromCharCode(65 + (v - 1) % 26) + result; return result; };
const quoted = name => `'${name.replaceAll("'", "''")}'`;
const valueOf = (value, key) => {
  if (key === 'legs' && /^\d+$/.test(String(value))) return Number(value);
  if (key === 'height' && /^\d+(?:[.,]\d+)?\s*m$/.test(String(value))) return Number(String(value).replace(/\s*m$/, '').replace(',', '.'));
  return value === undefined ? null : Array.isArray(value) ? value.join('\n') : value && typeof value === 'object' ? JSON.stringify(value) : value;
};
const numericFormat = value => Number.isInteger(value) ? '#,##0' : '#,##0.0';
function common(sheet, lastColumn, lastRow) {
  sheet.showGridLines = false;
  const range = sheet.getRange(`A1:${lastColumn}${lastRow}`);
  range.format.font = { name: 'Arial', size: 10, color: colors.ink };
  range.format.fill = colors.paper;
  range.format.verticalAlignment = 'center';
  range.format.rowHeight = 20;
  sheet.getRange(`A1:${lastColumn}1`).format.rowHeight = 10;
  sheet.getRange(`A2:${lastColumn}2`).format.rowHeight = 28;
  sheet.getRange('A2').format.font = { name: 'Arial', size: 16, bold: true, color: colors.ink };
  sheet.getRange(`A3:${lastColumn}3`).format.rowHeight = 23;
  sheet.getRange(`A3:${lastColumn}3`).format.borders = { bottom: { style: 'thin', color: colors.copper } };
  sheet.getRange(`A5:${lastColumn}5`).format.rowHeight = 11;
}
function tableHeader(sheet, range) {
  sheet.getRange(range).format = {
    fill: colors.ink,
    font: { name: 'Arial', size: 10, color: colors.paper, bold: true },
    horizontalAlignment: 'center', verticalAlignment: 'center', wrapText: true,
    borders: { insideVertical: { style: 'thin', color: '#FFFFFF' } },
  };
  sheet.getRange(range).format.rowHeight = 34;
}

const catalog = [];
for (const { spec, sheet, index } of sheetRecords) {
  const columns = spec.columns;
  const lastColumn = col(columns.length - 1);
  const lastRow = 6 + spec.rows.length;
  if (!columns.length || spec.rows.length === 0) throw new Error(`Empty design section ${spec.name}`);
  common(sheet, lastColumn, lastRow);
  sheet.getRange('A2').values = [[spec.name]];
  sheet.getRange('A3').values = [[spec.description || '']];
  sheet.getRange('A3').format.font = { name: 'Arial', size: 10, italic: true, color: colors.muted };
  sheet.getRange('A4').values = [[`ORDRE DE CENDRE. ${spec.rows.length} fiches. ${source.meta.version || '0.1'}`]];
  sheet.getRange('A4').format.font = { name: 'Arial', size: 10, color: colors.muted };
  const data = [columns.map(c => c.key === 'height' ? `${c.label} (m)` : c.label), ...spec.rows.map(row => columns.map(c => valueOf(row[c.key], c.key)))];
  sheet.getRange(`A6:${lastColumn}${lastRow}`).values = data;
  const table = sheet.tables.add(`A6:${lastColumn}${lastRow}`, true, `Bible_${String(index + 1).padStart(2, '0')}`);
  table.style = 'TableStyleLight1';
  table.showFilterButton = true;
  tableHeader(sheet, `A6:${lastColumn}6`);
  const body = sheet.getRange(`A7:${lastColumn}${lastRow}`);
  body.format.wrapText = true;
  body.format.verticalAlignment = 'top';
  body.format.horizontalAlignment = 'left';
  const widths = columns.map((c, ci) => {
    let width = c.width || (ci === 0 ? 13 : ci === 1 ? 28 : 38);
    // Input widths are character units, with a conservative bound for prose.
    width = Math.max(ci === 0 ? 12 : 17, Math.min(Number(width) || 32, 58));
    sheet.getRange(`${col(ci)}1:${col(ci)}${lastRow}`).format.columnWidth = width;
    return width;
  });
  for (let r = 0; r < spec.rows.length; r++) {
    const rowNumber = r + 7;
    const row = sheet.getRange(`A${rowNumber}:${lastColumn}${rowNumber}`);
    if (r % 2 === 1) row.format.fill = colors.pale;
    let lines = 1;
    columns.forEach((c, ci) => {
      const value = valueOf(spec.rows[r][c.key], c.key);
      if (typeof value === 'string') {
        const lineCount = value.split('\n').reduce((n, line) => n + Math.max(1, Math.ceil(line.length / Math.max(10, widths[ci] - 3))), 0);
        lines = Math.max(lines, lineCount);
      } else if (typeof value === 'number') {
        sheet.getRange(`${col(ci)}${rowNumber}`).setNumberFormat(numericFormat(value) + (['legs', 'height'].includes(c.key) ? '"  "' : ''));
        sheet.getRange(`${col(ci)}${rowNumber}`).format.horizontalAlignment = 'right';
      }
    });
    row.format.rowHeight = Math.max(35, Math.min(400, lines * 14 + 10));
  }
  sheet.getRange(`A7:A${lastRow}`).format.font = { name: 'Arial', size: 10, bold: true, color: colors.copper };
  const statusIndex = columns.findIndex(c => /^(status|statut)$/i.test(c.key) || /^statut$/i.test(c.label));
  if (statusIndex >= 0) {
    const statusRange = sheet.getRange(`${col(statusIndex)}7:${col(statusIndex)}${lastRow}`);
    statusRange.dataValidation = { rule: { type: 'list', values: statuses } };
    statusRange.format.horizontalAlignment = 'center';
    for (let s = 0; s < statuses.length; s++) statusRange.conditionalFormats.add('cellIs', { operator: 'equal', formula: `"${statuses[s]}"`, format: statusStyles[s] });
  }
  sheet.freezePanes.freezeRows(6);
  sheet.freezePanes.freezeColumns(Math.min(columns.length, 2));
  if (['Production', 'QA'].includes(spec.name)) sheet.tabColor = colors.copper;
  catalog.push({ name: spec.name, count: spec.rows.length, lastRow, lastColumn, statusIndex, sourceCounts: statuses.map(status => spec.rows.filter(row => statusIndex >= 0 && row[columns[statusIndex].key] === status).length) });
}

const summaryStart = 11;
const summaryEnd = summaryStart + catalog.length;
const totalRow = summaryEnd + 1;
const legendStart = totalRow + 4;
common(summary, 'G', legendStart + 6);
summary.getRange('A2').values = [['ORDRE DE CENDRE']];
summary.getRange('A3').values = [['Chaque pas laisse une trace. Bible de conception et suivi de production.']];
const referenceDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${source.meta.date}T00:00:00Z`));
summary.getRange('A4').values = [[`Nom de code ImperiumMarch. Version ${source.meta.version || '0.1'}. Référence du ${referenceDate}.`]];
summary.getRange('A6').values = [['Portée de cette version']];
summary.getRange('A6').format.font = { name: 'Arial', size: 11, bold: true, color: colors.copper };
const campaignIds = source.meta.release?.playableCampaignMissions || ['MI01'];
const remainingMissions = source.meta.release?.remainingCampaignMissionDesigns ?? 31;
const campaignList = new Intl.ListFormat('fr-FR', { style: 'long', type: 'conjunction' }).format(campaignIds);
summary.getRange('A7').values = [[`${campaignList} jouables au stade prototype. ${remainingMissions} autres missions principales conçues. OP01–OP03 restent autonomes.`]];
const walkerNames = source.meta.release?.playableWalkerNames || ['Vigie', 'Bastion', 'Pèlerin'];
summary.getRange('A8').values = [[`${walkerNames.length} châssis : ${walkerNames.join(', ')}. Radiateur réparable, stocks finis.`]];
summary.getRange('A9').values = [['Les compteurs portent sur des fiches de conception. Ils ne mesurent pas un pourcentage de jeu terminé.']];
summary.getRange('A9').format.font = { name: 'Arial', size: 10, italic: true, color: colors.muted };
summary.getRange(`A${summaryStart}:G${summaryStart}`).values = [['Domaine', 'Fiches', 'Conçu', 'Prototype', 'À produire', 'Vérifié', 'Sans statut']];
tableHeader(summary, `A${summaryStart}:G${summaryStart}`);
for (let i = 0; i < catalog.length; i++) {
  const record = catalog[i];
  const r = summaryStart + i + 1;
  summary.getRange(`A${r}`).values = [[record.name]];
  summary.getRange(`A${r}`).format.font = { name: 'Arial', size: 10, color: colors.copper, bold: true };
  summary.getRange(`B${r}`).formulas = [[`=COUNTA(${quoted(record.name)}!$A$7:$A$${record.lastRow})`]];
  for (let s = 0; s < statuses.length; s++) {
    const target = `${col(s + 2)}${r}`;
    if (record.statusIndex >= 0) summary.getRange(target).formulas = [[`=COUNTIFS(${quoted(record.name)}!$${col(record.statusIndex)}$7:$${col(record.statusIndex)}$${record.lastRow},${col(s + 2)}$${summaryStart})`]];
    else summary.getRange(target).values = [[0]];
  }
  summary.getRange(`G${r}`).formulas = [[`=B${r}-SUM(C${r}:F${r})`]];
  if (i % 2 === 1) summary.getRange(`A${r}:G${r}`).format.fill = colors.pale;
  summary.getRange(`A${r}:G${r}`).format.rowHeight = 24;
}
summary.getRange(`A${totalRow}`).values = [['TOTAL DES FICHES']];
for (let c = 1; c < 7; c++) summary.getRange(`${col(c)}${totalRow}`).formulas = [[`=SUM(${col(c)}${summaryStart + 1}:${col(c)}${summaryEnd})`]];
summary.getRange(`A${totalRow}:G${totalRow}`).format = { fill: colors.sand, font: { name: 'Arial', size: 10, bold: true, color: colors.ink }, rowHeight: 28, borders: { top: { style: 'thin', color: colors.copper } } };
summary.getRange(`B${summaryStart + 1}:G${totalRow}`).setNumberFormat('#,##0');
summary.getRange(`B${summaryStart + 1}:G${totalRow}`).format.horizontalAlignment = 'right';
summary.getRange(`A${legendStart}`).values = [['Signification des statuts']];
summary.getRange(`A${legendStart}`).format.font = { name: 'Arial', size: 11, bold: true, color: colors.copper };
const definitions = ['Spécification écrite. Production et validation encore nécessaires.', 'Version fonctionnelle partielle. Ne vaut pas validation de production.', 'Livrable prévu dont la réalisation est encore ouverte.', 'Critère contrôlé avec une preuve de validation associée.'];
for (let s = 0; s < statuses.length; s++) {
  const r = legendStart + s + 1;
  summary.getRange(`A${r}`).values = [[statuses[s]]];
  summary.getRange(`A${r}`).format.fill = statusStyles[s].fill;
  summary.getRange(`A${r}`).format.font = { name: 'Arial', size: 10, ...statusStyles[s].font };
  summary.getRange(`B${r}`).values = [[definitions[s]]];
  summary.getRange(`A${r}:G${r}`).format.rowHeight = 24;
}
summary.getRange('A1:A60').format.columnWidth = 28;
summary.getRange('B1:F60').format.columnWidth = 15;
summary.getRange('G1:G60').format.columnWidth = 18;

workbook.recalculate();
const independentTotal = source.sheets.reduce((sum, s) => sum + s.rows.length, 0);
const computedTotal = summary.getRange(`B${totalRow}`).values[0][0];
if (computedTotal !== independentTotal) throw new Error(`Total does not reconcile: ${computedTotal} versus ${independentTotal}`);
const computedStatusTotals = summary.getRange(`C${totalRow}:F${totalRow}`).values[0];
const expectedStatusTotals = statuses.map((_, s) => catalog.reduce((n, r) => n + r.sourceCounts[s], 0));
if (computedStatusTotals.some((n, i) => n !== expectedStatusTotals[i])) throw new Error('Status totals do not reconcile');
// Check that summary formula counts respond to an ordinary status edit.
const withStatus = sheetRecords.find(r => r.spec.columns.some(c => /^(status|statut)$/i.test(c.key)));
if (withStatus) {
  const statusIndex = withStatus.spec.columns.findIndex(c => /^(status|statut)$/i.test(c.key));
  const cell = withStatus.sheet.getRange(`${col(statusIndex)}7`);
  const original = cell.values[0][0];
  const changed = original === 'Vérifié' ? 'À produire' : 'Vérifié';
  const summaryRow = summaryStart + 1 + withStatus.index;
  const before = summary.getRange(`F${summaryRow}`).values[0][0];
  cell.values = [[changed]];
  workbook.recalculate();
  const after = summary.getRange(`F${summaryRow}`).values[0][0];
  if (after !== before + (changed === 'Vérifié' ? 1 : -1)) throw new Error('Status summary does not update after input edit');
  cell.values = [[original]];
  workbook.recalculate();
}
await fs.mkdir(outputDir, { recursive: true });
const inspection = await workbook.inspect({ kind: 'table', range: `Synthèse!A${summaryStart}:G${totalRow}`, include: 'values,formulas', tableMaxRows: 30, tableMaxCols: 7, maxChars: 7000 });
await fs.writeFile(path.join(outputDir, 'workbook-inspection.ndjson'), inspection.ndjson);
const errors = await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!', options: { useRegex: true, maxResults: 100 }, summary: 'Final formula error scan', maxChars: 5000 });
await fs.writeFile(path.join(outputDir, 'formula-check.ndjson'), errors.ndjson);
const summaryValues = summary.getRange(`A${summaryStart}:G${totalRow}`).values;
for (const row of summaryValues) for (const value of row) if (typeof value === 'string' && /^#(?:REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!|NULL!|SPILL!|CALC!)/.test(value)) throw new Error(`Formula error in summary: ${value}`);

const previews = [];
const previewConfig = process.env.BIBLE_PREVIEW_CONFIG ? JSON.parse(await fs.readFile(path.resolve(repoRoot, process.env.BIBLE_PREVIEW_CONFIG), 'utf8')) : {};
const previewSelection = process.env.BIBLE_RENDER_SHEETS ? process.env.BIBLE_RENDER_SHEETS.split(',') : previewConfig.sheets || null;
for (const [previewIndex, record] of [{ name: 'Synthèse', lastColumn: 'G' }, ...catalog].entries()) {
  if (previewSelection && !previewSelection.includes(record.name)) continue;
  const preview = await workbook.render({ sheetName: record.name, range: `A1:${record.lastColumn}${record.name === 'Synthèse' ? totalRow : 9}`, scale: 1, format: 'png' });
  const file = `${String(previewIndex).padStart(2, '0')}-${record.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_-]/g, '_')}.png`;
  await fs.writeFile(path.join(outputDir, file), new Uint8Array(await preview.arrayBuffer()));
  previews.push(file);
}
// Optional bounded views of added rows: avoid rerendering unchanged content.
const extraPreviews = process.env.BIBLE_EXTRA_PREVIEWS ? JSON.parse(process.env.BIBLE_EXTRA_PREVIEWS) : previewConfig.ranges || [];
for (const extra of extraPreviews) {
  if (!catalog.some(record => record.name === extra.sheetName)) throw new Error(`Unknown preview sheet ${extra.sheetName}`);
  if (!/^[A-Za-z0-9_-]+\.png$/.test(extra.file)) throw new Error('Preview name must be a simple PNG filename');
  const preview = await workbook.render({ sheetName: extra.sheetName, range: extra.range, scale: 1, format: 'png' });
  await fs.writeFile(path.join(outputDir, extra.file), new Uint8Array(await preview.arrayBuffer()));
  previews.push(extra.file);
}
const output = await SpreadsheetFile.exportXlsx(workbook);
const outputFile = path.join(outputDir, 'ORDRE_DE_CENDRE_Bible.xlsx');
await output.save(outputFile);
await fs.mkdir(path.join(repoRoot, 'docs'), { recursive: true });
await fs.copyFile(outputFile, path.join(repoRoot, 'docs', 'ORDRE_DE_CENDRE_Bible.xlsx'));
const report = { workbook: 'ORDRE_DE_CENDRE_Bible.xlsx', version: source.meta.version, sheets: catalog.length + 1, designRows: independentTotal, statusCounts: Object.fromEntries(statuses.map((s, i) => [s, expectedStatusTotals[i]])), catalog, previews, tests: ['Total des fiches réconcilié avec le JSON', 'Statuts réconciliés avec le JSON', 'Modification temporaire de statut et recalcul vérifiés, valeur restaurée'], scope: source.meta.scope };
await fs.writeFile(path.join(outputDir, 'workbook-validation.json'), JSON.stringify(report, null, 2) + '\n');
await fs.mkdir(path.join(repoRoot, 'docs', 'validation'), { recursive: true });
const reportRelease = source.meta.version.split('.').slice(0, 2).join('.') + (receiptSuffix ? `-${receiptSuffix}` : '');
await fs.copyFile(path.join(outputDir, 'workbook-validation.json'), path.join(repoRoot, 'docs', 'validation', `workbook-v${reportRelease}-validation.json`));
console.log(JSON.stringify({ outputFile, sheets: report.sheets, designRows: report.designRows, statusCounts: report.statusCounts, previews: previews.length }));
