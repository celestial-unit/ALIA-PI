import type { Handler } from '@netlify/functions';

const PRODUCTS = [
  {
    id: 'cardio-guard',
    name: 'CardioGuard Forte',
    indication: 'Hypertension and heart failure prevention',
    mechanism: 'ACE inhibitor combined with metabolic support',
    posology: '1 tablet daily, preferably in the morning',
    clinicalBenefits: '25% reduction in cardiovascular events vs baseline',
    studies: 'PROTECT-2024 Study involving 5000 patients',
    rcp: 'Full Summary of Product Characteristics (v1.2)',
  },
  {
    id: 'neuro-zen',
    name: 'NeuroZen',
    indication: 'Mild cognitive impairment',
    mechanism: 'Cholinergic pathway enhancement',
    posology: '5mg twice daily',
    clinicalBenefits: 'Improved memory retention scores in 6 months',
    studies: 'Cogni-Trial 2023',
    rcp: 'Full RCP (v2.0)',
  },
];

export const handler: Handler = async (event) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(PRODUCTS),
  };
};
