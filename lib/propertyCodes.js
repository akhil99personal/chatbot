/** Session-only chat property codes (in-memory — cleared on tab close/refresh). */

const codeToEntry = new Map();
const propertyIdToCode = new Map();
const sessionCodes = []; // Tracks order of property codes seen/queried/returned in search

const CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomCode() {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

export function markCodeAsActive(code) {
  if (!code) return;
  const c = String(code).toLowerCase();
  if (codeToEntry.has(c)) {
    const idx = sessionCodes.indexOf(c);
    if (idx !== -1) {
      sessionCodes.splice(idx, 1);
    }
    sessionCodes.push(c);
  }
}

/** Assign or return the stable 6-char code for a property shown in chat. */
export function getOrCreatePropertyCode(property) {
  const id = String(property?._id || property?.id || "");
  if (!id) return null;

  if (propertyIdToCode.has(id)) {
    const code = propertyIdToCode.get(id);
    markCodeAsActive(code);
    return code;
  }

  let code;
  do {
    code = randomCode();
  } while (codeToEntry.has(code));

  const entry = {
    propertyId: id,
    heading: property.heading || "",
    city: property.city || "",
    landmark: property.landmark || "",
    sellType: property.sellType || "",
    bedrooms: property.bedrooms || "",
  };

  codeToEntry.set(code, entry);
  propertyIdToCode.set(id, code);
  markCodeAsActive(code);
  return code;
}

export function lookupPropertyCode(code) {
  if (!code) return null;
  const c = String(code).toLowerCase();
  const entry = codeToEntry.get(c);
  if (entry) {
    markCodeAsActive(c);
  }
  return entry;
}

export function getCodeByPropertyId(id) {
  if (!id) return null;
  return propertyIdToCode.get(String(id)) || null;
}

export function getLastPropertyCode() {
  return sessionCodes.length > 0 ? sessionCodes[sessionCodes.length - 1] : null;
}

export function getPreviousPropertyCode() {
  if (sessionCodes.length > 1) {
    return sessionCodes[sessionCodes.length - 2];
  }
  return getLastPropertyCode();
}

export function getAllSessionCodes() {
  return [...sessionCodes];
}

/** Find known 6-char codes referenced in user text. */
export function extractCodesFromMessage(text) {
  if (!text) return [];
  const re = /\b([a-z0-9]{6})\b/gi;
  const found = [];
  let match;
  while ((match = re.exec(text)) !== null) {
    const code = match[1].toLowerCase();
    if (codeToEntry.has(code)) found.push(code);
  }
  return [...new Set(found)];
}

/** Resolve comparison codes, incorporating context and explicit references. */
export function resolveComparisonCodes(text) {
  let codes = extractCodesFromMessage(text);
  
  if (codes.length >= 2) {
    return codes.slice(0, 3);
  }

  if (codes.length === 1) {
    if (/previous|previouse/i.test(text)) {
      const prev = getPreviousPropertyCode();
      if (prev && prev !== codes[0]) {
        codes.push(prev);
      }
    } else {
      const last = getLastPropertyCode();
      if (last && last !== codes[0]) {
        codes.push(last);
      } else {
        const prev = getPreviousPropertyCode();
        if (prev && prev !== codes[0]) {
          codes.push(prev);
        }
      }
    }
  }

  if (codes.length === 0) {
    const last = getLastPropertyCode();
    const prev = getPreviousPropertyCode();
    if (last && prev && last !== prev) {
      codes = [prev, last];
    }
  }

  return codes.slice(0, 3);
}

/** Resolve a single property code from text using context keywords or hex ID. */
export function resolvePropertyCodeFromContext(text) {
  if (!text) return null;

  const explicitCodes = extractCodesFromMessage(text);
  if (explicitCodes.length > 0) {
    return explicitCodes[0];
  }

  const hexMatch = text.match(/\b([0-9a-fA-F]{23,24})\b/);
  if (hexMatch) {
    const id = hexMatch[1];
    return getOrCreatePropertyCode({ _id: id });
  }

  if (/previous\s+property|previouse\s+property/i.test(text)) {
    return getPreviousPropertyCode();
  }

  if (/this\s+property|give\s+direction|\bto\s+it\b|\bit\b/i.test(text)) {
    return getLastPropertyCode();
  }

  if (/(direction|directions|route|navigate|how\s+to\s+get|way\s+to|drive\s+to|reach|take\s+me\s+to)/i.test(text)) {
    return getLastPropertyCode();
  }

  return null;
}

/** Append resolved code → propertyId mapping for the AI (chat session only). */
export function expandMessageWithPropertyCodes(text) {
  // Always include the last 10 properties in the session to ensure Gemini has full context
  const codes = [...sessionCodes].reverse().slice(0, 10);
  if (codes.length === 0) return text;

  const lines = codes.map((code) => {
    const e = codeToEntry.get(code);
    const label = [e.bedrooms && e.bedrooms !== "1RK" ? `${e.bedrooms} BHK` : e.bedrooms, e.heading, e.landmark, e.city]
      .filter(Boolean)
      .join(", ");
    return `- ${code} → propertyId: ${e.propertyId}${label ? ` (${label}${e.sellType ? `, ${e.sellType}` : ""})` : ""}`;
  });

  return `${text}\n\n[CHAT PROPERTY CODES — current browser session only]\n${lines.join("\n")}\nWhen the user asks for details/info about a code, call get_property_details with that propertyId.\nWhen they ask to compare two or more codes (e.g. "compare abc123 and def456"), call compare_properties with those propertyIds.`;
}
