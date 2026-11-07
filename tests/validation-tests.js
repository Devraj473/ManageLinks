/**
 * ManageLinks - Validation and URL Utilities Test Suite
 * Developer: Devraj Chauhan
 */

import { Validators } from '../utils/validators.js';
import { UrlUtils } from '../utils/url-utils.js';
import { DateUtils } from '../utils/date-utils.js';

export async function runValidationTests(assert) {
  console.log('Running Validation & URL tests...');

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
}
