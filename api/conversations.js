import path from 'path';
import { promises as fs } from 'fs';

// Parse a line of the exported chat file into a structured message.
function parseLine(line) {
  const sanitized = line.trim().replace(/[\u202f\u00a0]/g, ' '); // normalize narrow/non-breaking spaces
  if (!sanitized) return null;

  const match = sanitized.match(
    /^(\d{1,2}\/\d{1,2}\/\d{2}),\s*([0-9:]+\s*[APMapm]{2})\s+-\s+([^:]+):\s+(\d+)(?:\s*\((Assistant)\))?:\s*(.+)$/
  );

  if (!match) return null;

  const [_, datePart, timePartRaw, senderName, phoneNumber, assistantMarker, content] = match;
  const timePart = timePartRaw.replace(/\s+/, ' ').trim();
  const timestamp = toIso(datePart, timePart);
  const role = assistantMarker ? 'assistant' : 'user';

  return { phoneNumber, role, content: content.trim(), timestamp, senderName: senderName.trim() };
}

function toIso(datePart, timePart) {
  const [month, day, yearShort] = datePart.split('/').map(Number);
  const [timeString, meridiemRaw = ''] = timePart.split(/\s+/);
  const [hourRaw, minuteRaw = '0'] = timeString.split(':');

  let hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const meridiem = meridiemRaw.toUpperCase();

  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  const year = 2000 + yearShort; // chat export uses two-digit year
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return date.toISOString();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const chatsPath = path.join(process.cwd(), 'candidatos', 'chats.txt');
    const raw = await fs.readFile(chatsPath, 'utf8');
    const lines = raw.split(/\r?\n/);

    const conversationsMap = new Map();

    for (const line of lines) {
      const parsed = parseLine(line);
      if (!parsed) continue;

      const { phoneNumber, role, content, timestamp, senderName } = parsed;
      const key = phoneNumber;

      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          phoneNumber,
          phoneNumberId: 'whatsapp-txt',
          messages: [],
          messageCount: 0,
          firstMessageTime: timestamp,
          lastMessageTime: timestamp
        });
      }

      const conv = conversationsMap.get(key);
      conv.messages.push({ role, content, timestamp, senderName });
      conv.messageCount += 1;
      conv.lastMessageTime = timestamp;
    }

    const conversations = Array.from(conversationsMap.values());
    conversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    return res.status(200).json(conversations);
  } catch (err) {
    console.error('Failed to parse conversations from chats.txt', err);
    return res.status(500).json({ error: 'Failed to fetch conversations from chats.txt' });
  }
}
