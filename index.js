import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import { Resend } from 'resend';

dotenv.config();
const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);
const BAD_WORDS = ['fuck','shit','bitch','dick','cunt','asshole','nigger','fag','pussy','bastard'];
const BANNED_PATH = './banned.json';

app.use(cors());
app.use(bodyParser.json());

// Load banned IDs
let bannedIDs = fs.existsSync(BANNED_PATH)
  ? JSON.parse(fs.readFileSync(BANNED_PATH))
  : [];

function saveBans() {
  fs.writeFileSync(BANNED_PATH, JSON.stringify(bannedIDs, null, 2));
}

app.post('/suggest', async (req, res) => {
  const { message, deviceId } = req.body;
  if (!message || !deviceId) return res.status(400).json({ error: 'Missing fields' });
  if (bannedIDs.includes(deviceId)) return res.status(403).json({ error: 'You are banned' });
  if (message.length > 400) return res.status(400).json({ error: 'Too long' });

  const hasBadWord = BAD_WORDS.some(word => message.toLowerCase().includes(word));
  if (hasBadWord) {
    bannedIDs.push(deviceId);
    saveBans();
    return res.status(403).json({ error: 'Inappropriate - banned 10 mins' });
  }

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'studentcouncill2025@gmail.com',
      subject: 'New Suggestion',
      html: `<p>${message}</p>`,
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Send failed' });
  }
});

app.get('/', (req, res) => res.send('Backend Live'));

app.get('/admin/banned', (req, res) => {
  const { pin } = req.query;
  if (pin !== process.env.ADMIN_PIN) return res.status(403).send('Unauthorized');
  res.json(bannedIDs);
});

app.post('/admin/unban', (req, res) => {
  const { pin, deviceId } = req.body;
  if (pin !== process.env.ADMIN_PIN) return res.status(403).send('Unauthorized');
  bannedIDs = bannedIDs.filter(id => id !== deviceId);
  saveBans();
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));

