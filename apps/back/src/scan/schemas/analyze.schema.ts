const shortList = (maxItems: number) => ({
  type: 'array',
  items: { type: 'string', minLength: 1, maxLength: 500 },
  maxItems,
});

export const ANALYZE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    is_plastic: { type: 'boolean' },
    reason_invalid: { type: ['string', 'null'], minLength: 1, maxLength: 300 },
    materials: shortList(5),
    preparation: shortList(8),
    impact: shortList(4),
    environmental_damage: shortList(4),
    weight_estimate: { type: ['number', 'null'], minimum: 0 },
  },
  required: [
    'is_plastic',
    'reason_invalid',
    'materials',
    'preparation',
    'impact',
    'environmental_damage',
    'weight_estimate',
  ],
} as const;
