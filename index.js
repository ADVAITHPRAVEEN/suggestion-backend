import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(bodyParser.json());

const BAD_WORDS = ['fuck','shit','bitch','dick','cunt','asshole','nigger','fag','pussy','bastard'];

app.post('/suggest', async (req, res) => {
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: 'Message is required' });
  if (message.length > 400) return res.status(400).json({ error: 'Too long' });

  const hasBadWord = BAD_WORDS.some(w => message.toLowerCase().includes(w));
  if (hasBadWord) return res.status(403).json({ error: 'Inappropriate' });

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

app.get('/', (req, res) => res.send('Suggestion backend live'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));

