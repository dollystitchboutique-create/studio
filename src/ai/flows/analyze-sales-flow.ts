'use server';
/**
 * @fileOverview AI flow to analyze sales data and provide business growth insights.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SalesAnalysisInputSchema = z.object({
  salesData: z.array(z.object({
    total: z.number(),
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number(),
    })),
    timestamp: z.string(),
  })).describe('Recent sales transaction data.'),
});

const SalesAnalysisOutputSchema = z.object({
  summary: z.string().describe('A summary of performance.'),
  recommendation: z.string().describe('One specific business recommendation.'),
  topPerformer: z.string().describe('The best selling product or category identified.'),
});

const prompt = ai.definePrompt({
  name: 'analyzeSalesPrompt',
  input: { schema: SalesAnalysisInputSchema },
  output: { schema: SalesAnalysisOutputSchema },
  prompt: `You are a strategic business analyst for Dollystitch Hub, an artisanal jewelry boutique.
  
  Review the following recent sales data:
  {{#each salesData}}
  - Sale: ${{total}}, Items: {{#each items}}{{quantity}}x {{name}}; {{/each}}
  {{/each}}
  
  Provide a professional summary of current performance, identify the top performer, and give one creative recommendation to increase sales next month (e.g., a specific promotion or focus area).`,
});

export async function analyzeSales(input: z.infer<typeof SalesAnalysisInputSchema>) {
  const { output } = await prompt(input);
  return output!;
}

export const analyzeSalesFlow = ai.defineFlow(
  {
    name: 'analyzeSalesFlow',
    inputSchema: SalesAnalysisInputSchema,
    outputSchema: SalesAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
