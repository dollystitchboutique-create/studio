'use server';
/**
 * @fileOverview AI flow to identify jewelry products from a photo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProductSchema = z.object({
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  color: z.string(),
});

const IdentifyInputSchema = z.object({
  photoDataUri: z.string().describe("Photo of the jewelry piece as a data URI."),
  catalog: z.array(ProductSchema).describe("List of available products in the catalogue."),
});

const IdentifyOutputSchema = z.object({
  matchFound: z.boolean().describe("Whether a matching product was found."),
  sku: z.string().optional().describe("The SKU of the matched product."),
  confidence: z.number().optional().describe("Confidence score between 0 and 1."),
  reasoning: z.string().optional().describe("Brief explanation of why this product was chosen."),
});

export async function identifyProduct(input: z.infer<typeof IdentifyInputSchema>) {
  const prompt = ai.definePrompt({
    name: 'identifyProductPrompt',
    input: { schema: IdentifyInputSchema },
    output: { schema: IdentifyOutputSchema },
    prompt: `You are an expert at identifying artisanal jewelry from Dollystitch Hub.
    
    Given this photo: {{media url=photoDataUri}}
    
    And this catalogue of products:
    {{#each catalog}}
    - SKU: {{sku}}, Name: {{name}}, Category: {{category}}, Material/Color: {{color}}
    {{/each}}
    
    Analyze the photo and determine which product from the catalogue it is.
    Focus on the shape, category (e.g., ear cuff vs arm cuff), and material color.
    
    If you are reasonably certain, return the SKU. If you cannot find a good match, set matchFound to false.`,
  });

  const { output } = await prompt(input);
  return output!;
}

export const identifyProductFlow = ai.defineFlow(
  {
    name: 'identifyProductFlow',
    inputSchema: IdentifyInputSchema,
    outputSchema: IdentifyOutputSchema,
  },
  async (input) => {
    return identifyProduct(input);
  }
);
