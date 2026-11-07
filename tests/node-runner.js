/**
 * ManageLinks - Node.js Automated Test Verification
 * Tests pure logic, parsing, and normalization directly via Node
 */

import { Validators } from '../utils/validators.js';
import { UrlUtils } from '../utils/url-utils.js';
import { DateUtils } from '../utils/date-utils.js';
import { CsvParser } from '../utils/csv-parser.js';
import { ImportManager } from '../assets/js/import.js';

let total = 0;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`\x1b[32m✔ PASS:\x1b[0m ${message}`);
  } else {
    failed++;
    console.error(`\x1b[31m✖ FAIL:\x1b[0m ${message}`);
  }
}

async function run() {
  console.log('--- Running ManageLinks Node Tests ---');

  // URL Validator tests
  assert(Validators.isValidUrl('https://example.com'), 'Valid HTTPS URL recognized');
  assert(Validators.isValidUrl('http://sub.domain.org/path?q=1'), 'Valid HTTP with query recognized');
  assert(!Validators.isValidUrl('javascript:alert(1)'), 'Dangerous scheme rejected');
  assert(!Validators.isValidUrl('not-a-url'), 'Invalid string rejected');

  // Protocol normalizer
  assert(Validators.ensureProtocol('example.com') === 'https://example.com', 'Prepends https:// when missing');
  assert(Validators.ensureProtocol('http://test.com') === 'http://test.com', 'Preserves existing http://');

  // Title validation
  assert(Validators.isValidTitle('My Bookmark'), 'Valid title accepted');
  assert(!Validators.isValidTitle('   '), 'Whitespace title rejected');
  assert(!Validators.isValidTitle(''), 'Empty title rejected');

  // PIN validation
  assert(Validators.isValidPin('1234'), 'Valid 4-digit PIN accepted');
  assert(Validators.isValidPin('987654'), 'Valid 6-digit PIN accepted');
  assert(!Validators.isValidPin('12a4'), 'Alpha PIN rejected');
  assert(!Validators.isValidPin('123'), 'Short PIN (<4 digits) rejected');

  // URL normalization & duplicate detection
  const norm1 = UrlUtils.normalizeUrl('https://example.com/');
  const norm2 = UrlUtils.normalizeUrl('https://example.com');
  assert(norm1 === norm2, 'Normalized URL removes trailing slash on root');

  const dup1 = UrlUtils.areDuplicates('https://github.com/torvalds/linux#readme', 'https://github.com/torvalds/linux');
  assert(dup1, 'Duplicates match ignoring hash fragments');

  // Title generation from URL
  const genTitle = UrlUtils.generateTitleFromUrl('https://github.com/torvalds/linux');
  assert(genTitle.toLowerCase().includes('linux'), 'Generates sensible title from path');

  // Initials extraction
  const initials = UrlUtils.getDomainInitials('https://developer.mozilla.org');
  assert(initials === 'DE', 'Extracts 2 uppercase initial letters');

  // Format Copy
  const mdCopy = UrlUtils.formatCopy('markdown', 'Test Link', 'https://test.com');
  assert(mdCopy === '[Test Link](https://test.com)', 'Markdown copy format matches [Title](URL)');

  const htmlCopy = UrlUtils.formatCopy('html', 'Test Link', 'https://test.com');
  assert(htmlCopy.includes('<a href="https://test.com"'), 'HTML copy format matches <a href="...">');

  // CSV roundtrip
  const testLinks = [
    { title: 'Test, Site', url: 'https://test.com', tags: ['a', 'b'], isFavorite: true },
    { title: 'Simple', url: 'https://simple.com', tags: [], isFavorite: false }
  ];
  const csv = CsvParser.generate(testLinks);
  assert(csv.includes('"Test, Site"'), 'CSV quotes embedded comma');
  const rows = CsvParser.parse(csv);
  assert(rows.length === 2, 'CSV parses 2 rows back');
  assert(rows[0].url === 'https://test.com', 'CSV URL parsed correctly');

  // Universal JSON Import tests
  const mlBackup = JSON.stringify({
    manifest: { version: '1.1.0' },
    links: [{ title: 'Google', url: 'https://google.com' }],
    categories: [{ name: 'Search', color: '#2563eb' }]
  });
  const res1 = await ImportManager.parseJson(mlBackup);
  assert(Array.isArray(res1) && res1.length === 1 && ImportManager.stagedCategories?.length === 1, 'Import parses full ManageLinks backup with categories');

  const rawArray = JSON.stringify([{ title: 'GitHub', url: 'https://github.com' }]);
  const res2 = await ImportManager.parseJson(rawArray);
  assert(Array.isArray(res2) && res2.length === 1, 'Import parses raw array of bookmarks');

  const chromeBookmarks = JSON.stringify({
    roots: {
      bookmark_bar: {
        children: [
          { type: 'url', name: 'OpenAI', url: 'https://openai.com' },
          { type: 'folder', name: 'Dev Tools', children: [{ type: 'url', name: 'Stack Overflow', url: 'https://stackoverflow.com' }] }
        ]
      }
    }
  });
  const res3 = await ImportManager.parseJson(chromeBookmarks);
  assert(Array.isArray(res3) && res3.length === 2, 'Import parses nested Chrome bookmarks tree');

  const customObj = JSON.stringify({ data: [{ title: 'MDN', url: 'https://developer.mozilla.org' }] });
  const res4 = await ImportManager.parseJson(customObj);
  assert(Array.isArray(res4) && res4.length === 1, 'Import parses custom object with data array');

  const singleObj = JSON.stringify({ title: 'Anthropic', url: 'https://anthropic.com' });
  const res5 = await ImportManager.parseJson(singleObj);
  assert(Array.isArray(res5) && res5.length === 1, 'Import parses single bookmark object');

  console.log(`\nResults: ${passed}/${total} passed (${failed} failed)`);
  if (failed > 0) {
    process.exit(1);
  }
}

run();
