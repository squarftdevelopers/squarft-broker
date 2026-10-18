import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePreferredLocations, addPreferredLocation } from '../utils/preferredLocations.js';

test('preserves complete addresses, including legacy single addresses', () => {
  const address = 'Vijay Nagar, Indore, Madhya Pradesh';
  assert.deepEqual(normalizePreferredLocations(address), [address]);
  assert.deepEqual(normalizePreferredLocations([address, 'Palasia, Indore']), [address, 'Palasia, Indore']);
});
test('adds multiple map selections without duplicates or blank entries', () => {
  const initial = addPreferredLocation([], ' Vijay Nagar, Indore ');
  const multiple = addPreferredLocation(initial, 'Palasia, Indore');
  assert.deepEqual(addPreferredLocation(multiple, 'vijay nagar, indore'), multiple);
  assert.deepEqual(normalizePreferredLocations([...multiple, '', null]), multiple);
  assert.deepEqual(initial, ['Vijay Nagar, Indore']);
});
test('array round trip retains every location and permits removal', () => {
  const locations = ['Vijay Nagar, Indore', 'Palasia, Indore'];
  const restored = normalizePreferredLocations(JSON.parse(JSON.stringify(locations)));
  assert.deepEqual(restored, locations);
  assert.deepEqual(restored.filter((_, index) => index !== 0), ['Palasia, Indore']);
});
