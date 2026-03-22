// Simple YAML parser for flat key:value and basic lists
function parseYAML(text) {
  const result = {};
  const lines = text.split('\n');
  let currentKey = null;
  let currentList = null;
  let currentItem = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;

    // List item field: "    - key: value" or "  - key: value"
    const listItemFieldMatch = line.match(/^(\s{2,})-\s+(\w+):\s*(.*)/);
    const listItemContinueMatch = line.match(/^(\s{4,})(\w+):\s*(.*)/);
    const listStartMatch = line.match(/^(\s*)-\s+(.*)/);
    const keyValueMatch = line.match(/^(\w+):\s*(.*)/);
    const blockScalarMatch = line.match(/^(\w+):\s*\|/);

    if (blockScalarMatch) {
      currentKey = blockScalarMatch[1];
      result[currentKey] = '';
      currentList = null;
      currentItem = null;
      // Read subsequent indented lines
      let j = i + 1;
      while (j < lines.length && (lines[j].startsWith('  ') || lines[j].trim() === '')) {
        result[currentKey] += lines[j].replace(/^  /, '') + '\n';
        j++;
      }
      i = j - 1;
    } else if (keyValueMatch && !line.startsWith(' ')) {
      const key = keyValueMatch[1];
      const val = keyValueMatch[2].trim();
      if (val === '' || val === '|') {
        // Could be a list or block
        currentKey = key;
        currentList = null;
        currentItem = null;
        if (!result[key]) result[key] = [];
      } else {
        result[key] = val.replace(/^["']|["']$/g, '');
        currentKey = key;
        currentList = null;
        currentItem = null;
      }
    } else if (listItemFieldMatch) {
      // Start of a new list item
      if (!Array.isArray(result[currentKey])) result[currentKey] = [];
      currentItem = {};
      currentItem[listItemFieldMatch[2]] = listItemFieldMatch[3].replace(/^["']|["']$/g, '');
      result[currentKey].push(currentItem);
      currentList = result[currentKey];
    } else if (listItemContinueMatch && currentItem) {
      currentItem[listItemContinueMatch[2]] = listItemContinueMatch[3].replace(/^["']|["']$/g, '');
    }
  }
  return result;
}

async function loadData(file) {
  if (typeof file !== 'string' || !/^[a-zA-Z0-9_-]+\.yml$/.test(file)) return null;
  const res = await fetch('/_data/' + file);
  if (!res.ok) return null;
  const text = await res.text();
  return parseYAML(text);
}

window.CMS = { loadData };
