// Runs the lint part of n8n's community package scanner on this checkout, so problems show
// up before n8n reviews a published version. Run it from the repo root with
// `npm run lint:n8n` after a build, the second pass lints dist.
import { analyzePackage, SOURCE_FILE_PATTERNS } from '@n8n/scan-community-package/scanner/scanner.mjs';

const root = process.cwd();

// The same two passes as the scanner: the TypeScript sources, then the compiled package
const passes = [
	['source', await analyzePackage(root, SOURCE_FILE_PATTERNS)],
	['dist', await analyzePackage(root, ['dist/**/*.js', 'package.json'])],
];

let failed = false;
for (const [name, result] of passes) {
	if (result.passed) continue;
	failed = true;
	console.error(`n8n scanner, ${name} pass: ${result.message}`);
	if (result.details) console.error(result.details);
}

if (!failed) console.log('n8n scanner lint passed');
process.exit(failed ? 1 : 0);
