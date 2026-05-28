
'use server';
/**
 * @fileOverview AI flow to generate jewelry inspiration images using Imagen.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InspirationInputSchema = z.object({
  prompt: z.string().describe('Description of the jewelry piece to imagine.'),
});

const InspirationOutputSchema = z.object({
  imageUrl: z.string().describe('Data URI of the generated image.'),
});

export async function generateInspiration(input: z.infer<typeof InspirationInputSchema>) {
  const { media } = await ai.generate({
    model: 'googleai/imagen-4.0-fast-generate-001',
    prompt: `A high-end, professional product photograph of artisanal jewelry: ${input.prompt}. Cinematic lighting, elegant display, luxury background, 8k resolution, boutique style.`,
  });
  
  if (!media) {
    throw new Error('Failed to generate image');
  }
  
  return { imageUrl: media.url };
}

export const generateInspirationFlow = ai.defineFlow(
  {
    name: 'generateInspirationFlow',
    inputSchema: InspirationInputSchema,
    outputSchema: InspirationOutputSchema,
  },
  async (input) => {
    return generateInspiration(input);
  }
);
