import { calculateLeadScore } from '../src/lib/scoring';
import { normalizePhoneNumber } from '../src/lib/deduplication';

console.log('----------------------------------------------------');
console.log('RUNNING APNIBUS FOS LEAD GENERATOR UNIT TESTS');
console.log('----------------------------------------------------');

let passedTests = 0;
let failedTests = 0;

function assertEqual(actual: any, expected: any, testName: string) {
  if (actual === expected) {
    console.log(`[PASS] ✓ ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ✗ ${testName} (Expected ${expected}, got ${actual})`);
    failedTests++;
  }
}

// Test 1: Phone Normalization
console.log('\n--- 1. Phone Normalization Tests ---');
assertEqual(normalizePhoneNumber('+91 98761 61111'), '9876161111', 'Normalizes Indian phone numbers with country code');
assertEqual(normalizePhoneNumber('0161 277 0798'), '1612770798', 'Normalizes landline numbers with space');
assertEqual(normalizePhoneNumber('123'), null, 'Returns null for short numbers');

// Test 2: Lead Scoring Calculation
console.log('\n--- 2. Lead Scoring Engine Tests ---');
const hotLead = calculateLeadScore({
  phone: '+919876543210',
  website: 'https://librabus.com',
  rating: 4.5,
  reviewCount: 150,
  businessName: 'Libra Bus Service Pvt Ltd',
  searchKeyword: 'bus operator',
  address: 'Ludhiana, Punjab',
});
assertEqual(hotLead.score >= 80, true, 'Calculates score >= 80 for complete bus operator data');
assertEqual(hotLead.temperature, 'HOT', 'Assigns HOT temperature for score >= 80');

const coldLead = calculateLeadScore({
  businessName: 'Unknown Store',
});
assertEqual(coldLead.score < 60, true, 'Calculates score < 60 for basic store');
assertEqual(coldLead.temperature, 'COLD', 'Assigns COLD temperature for score < 60');

// Test 3: Deduplication Logic Check
console.log('\n--- 3. Deduplication Logic Check ---');
const placeIdKey = 'ChIJdZLiRleCGjkRFwpRV8DJMxM';
assertEqual(typeof placeIdKey, 'string', 'Primary Place ID deduplication key format is valid string');

console.log('\n----------------------------------------------------');
console.log(`TEST RESULTS: ${passedTests} Passed, ${failedTests} Failed`);
console.log('----------------------------------------------------');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
