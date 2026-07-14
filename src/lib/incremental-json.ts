/**
 * Extract complete object items from a named top-level JSON array while the full JSON
 * document is still streaming. Strings and nested arrays/objects are handled safely.
 */
export function extractCompleteArrayObjects(json: string, key: string): unknown[] {
  const keyMatch = new RegExp(`"${escapeRegExp(key)}"\\s*:\\s*\\[`).exec(json);
  if (!keyMatch) return [];

  const arrayStart = keyMatch.index + keyMatch[0].length - 1;
  const items: unknown[] = [];
  let arrayDepth = 1;
  let objectDepth = 0;
  let objectStart = -1;
  let inString = false;
  let escaped = false;

  for (let index = arrayStart + 1; index < json.length; index += 1) {
    const character = json[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === "[") {
      arrayDepth += 1;
      continue;
    }

    if (character === "]") {
      arrayDepth -= 1;
      if (arrayDepth === 0) break;
      continue;
    }

    if (character === "{") {
      if (arrayDepth === 1 && objectDepth === 0) objectStart = index;
      objectDepth += 1;
      continue;
    }

    if (character === "}") {
      objectDepth -= 1;
      if (objectDepth === 0 && objectStart >= 0) {
        try {
          items.push(JSON.parse(json.slice(objectStart, index + 1)));
        } catch {
          return items;
        }
        objectStart = -1;
      }
    }
  }

  return items;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
