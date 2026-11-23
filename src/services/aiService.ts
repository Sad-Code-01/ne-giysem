import type { OutfitProfile, WeatherSnapshot } from '@/types';
import { getAiApiKey } from '@/storage/aiKey';

/**
 * EVREN LLM Gateway istemcisi (OpenAI-uyumlu /v1/chat/completions).
 * Kullanıcının kendi anahtarı Authorization: Bearer ile gider;
 * anahtar hiçbir zaman koda gömülmez. Bağlantı hatası/anahtar yoksa
 * ServiceError('api'|'offline') fırlatır.
 */

const BASE_URL = 'https://evren-llmapi.ssyz.org.tr';
const CHAT_TIMEOUT_MS = 90_000;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

function buildSystemPrompt(snapshot: WeatherSnapshot | null, profile: OutfitProfile): string {
  const lines: string[] = [
    'Sen "Ne Giysem?" uygulamasının kıyafet ve hava durumu asistanısın.',
    'Kısa, pratik ve Türkçe cevap ver. Hava ve giyim dışı konularda kibarca konuyu geri çevir.',
  ];
  if (snapshot) {
    const c = snapshot.current;
    lines.push(
      `Kullanıcının yeri: ${snapshot.place.name}${snapshot.place.region ? `, ${snapshot.place.region}` : ''}.`,
      `Şu an: ${Math.round(c.temperature)}°C (hissedilen ${Math.round(c.apparentTemperature)}°C), nem %${Math.round(c.humidity)}, rüzgâr ${Math.round(c.windSpeed)} km/h, WMO kodu ${c.weatherCode}.`,
      `Yağış olasılığı %${Math.round(c.precipitationProbability)}.`
    );
  } else {
    lines.push('Hava durumu verisi henüz yok; genel giyim önerileri verebilirsin.');
  }
  lines.push(
    `Kullanıcı profili: üşüme hassasiyeti=${profile.coldSensitivity}, ulaşım=${profile.transport}, aktivite=${profile.activity ?? 'walk'}, yağmur tercihi=${profile.rainPreference ?? 'both'}, öğrenilen ofset=${profile.learnedOffset}.`
  );
  return lines.join('\n');
}

/**
 * Sohbet tamamlama çağrısı. `history` kullanıcı/ asistan mesajlarını içerir;
 * sistem mesajı güncel hava+profil bağlamıyla otomatik eklenir.
 */
export async function sendChatMessage(
  history: ChatMessage[],
  snapshot: WeatherSnapshot | null,
  profile: OutfitProfile
): Promise<string> {
  const apiKey = await getAiApiKey();
  if (!apiKey) {
    throw new Error('AI_API_KEY_MISSING');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: 'auto',
        messages: [
          { role: 'system', content: buildSystemPrompt(snapshot, profile) },
          ...history,
        ],
        temperature: 0.6,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as ChatResponse | null;
    if (!response.ok) {
      throw new Error(data?.error?.message ?? `AI servisi hatası (${response.status})`);
    }
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('AI servisi boş yanıt döndü.');
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}
