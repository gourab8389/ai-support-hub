import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';

export const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const geminiModels = {
  pro: genAI.getGenerativeModel({ model: 'gemini-pro' }),
  proVision: genAI.getGenerativeModel({ model: 'gemini-pro-vision' }),
};

export const geminiConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};