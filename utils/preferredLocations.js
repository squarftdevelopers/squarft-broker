// A full address is one entry; commas inside addresses must remain intact.
export function normalizePreferredLocations(value) {
  const entries = Array.isArray(value) ? value : [value];
  const seen = new Set();
  return entries.filter(item => typeof item === 'string').map(item => item.trim()).filter(item => {
    const key = item.toLowerCase();
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function addPreferredLocation(value, address) {
  return normalizePreferredLocations([...normalizePreferredLocations(value), address]);
}
