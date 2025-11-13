#!/usr/bin/env node
/**
 * Project Model Manifest Generator
 * Scans the repository root for .mpd and .ldr files (AI / custom builds)
 * Run: node generate-root-models-manifest.js
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = './root-models-manifest.json';
const VALID_EXTENSIONS = new Set(['.mpd', '.ldr']);

function parseHeader(filePath) {

	try {

		const content = fs.readFileSync( filePath, 'utf8' );
		const lines = content.split( '\n' ).slice( 0, 12 );
		let name = '';
		let author = '';
		let description = '';

		for ( const line of lines ) {

			const trimmed = line.trim();

			if ( trimmed.startsWith( '0 Name:' ) ) {

				name = trimmed.substring( 7 ).trim();

			} else if ( trimmed.startsWith( '0 Author:' ) ) {

				author = trimmed.substring( 9 ).trim();

			} else if ( trimmed.startsWith( '0' ) && ! trimmed.startsWith( '0 !' ) && ! description ) {

				const text = trimmed.substring( 1 ).trim();

				if ( text && ! text.startsWith( 'Name:' ) && ! text.startsWith( 'Author:' ) ) {

					description = text;

				}

			}

		}

		return { name, author, description };

	} catch ( err ) {

		return { name: '', author: '', description: '' };

	}

}

function scanRoot() {

	const cwd = process.cwd();
	const entries = fs.readdirSync( cwd );
	const files = [];

	for ( const entry of entries ) {

		const fullPath = path.join( cwd, entry );
		const stat = fs.statSync( fullPath );

		if ( ! stat.isFile() ) continue;

		const ext = path.extname( entry ).toLowerCase();

		if ( ! VALID_EXTENSIONS.has( ext ) ) continue;

		const metadata = parseHeader( fullPath );

		files.push( {
			filename: entry,
			path: entry.replace( /\\/g, '/' ),
			size: stat.size,
			name: metadata.name || entry,
			description: metadata.description,
			author: metadata.author
		} );

	}

	return files.sort( ( a, b ) => a.filename.localeCompare( b.filename, undefined, { sensitivity: 'base' } ) );

}

function main() {

	console.log( '🔍 Scanning project root for MPD/LDR files...' );
	const files = scanRoot();

	const manifest = {
		generated: new Date().toISOString(),
		count: files.length,
		files
	};

	fs.writeFileSync( OUTPUT_FILE, JSON.stringify( manifest, null, 2 ) );
	console.log( `✅ Indexed ${files.length} project models -> ${OUTPUT_FILE}` );

}

try {

	main();

} catch ( err ) {

	console.error( '❌ Failed to generate root model manifest:', err );
	process.exit( 1 );

}

