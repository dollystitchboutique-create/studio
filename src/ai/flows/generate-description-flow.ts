'use server';
/**
 * @fileOverview AI flow to generate luxurious product descriptions for artisanal jewelry.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DescriptionInputSchema = z.object({
  name: z.string().describe('The name of the jewelry piece.'),
  category: z.string().describe('The category (e.g., Necklace, Ring).'),
  color: z.string().describe('Material or color description.'),
  spec: z.string().describe('Technical specifications (e.g., 18k gold).'),
});

const DescriptionOutputSchema = z.object({
  description: z.string().describe('A high-end, romantic marketing description.'),
});

const prompt = ai.definePrompt({
  name: 'generateJewelryDescriptionPrompt',
  input: { schema: DescriptionInputSchema },
  output: { schema: DescriptionOutputSchema },
  prompt: `You are an expert copywriter for a high-end artisanal jewelry brand called Dollystitch Hub.
  
  Write a short, evocative, and luxurious marketing description for the following piece:
  Name: {{{name}}}
  Category: {{{category}}}
  Material/Color: {{{color}}}
  Specs: {{{spec}}}
  
  Focus on the craftsmanship, the emotion it evokes, and the timeless nature of the piece. Keep it under 60 words.`,
});

export async function generateJewelryDescription(input: z.infer<typeof DescriptionInputSchema>) {
  const { output } = await prompt(input);
  return output!;
}

export const generateDescriptionFlow = ai.defineFlow(
  {
    name: 'generateDescriptionFlow',
    inputSchema: DescriptionInputSchema,
    outputSchema: DescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
