const shortList = (maxItems: number) => ({
  type: 'array',
  items: { type: 'string', minLength: 1, maxLength: 500 },
  maxItems,
});

export const ANALYZE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    es_plastico: { type: 'boolean' },
    motivo_invalido: { type: ['string', 'null'], minLength: 1, maxLength: 300 },
    materiales: shortList(5),
    preparacion: shortList(8),
    impacto_inmediato: shortList(4),
    daño_ambiental: shortList(4),
    peso_estimado: { type: ['number', 'null'], minimum: 0 },
  },
  required: [
    'es_plastico',
    'motivo_invalido',
    'materiales',
    'preparacion',
    'impacto_inmediato',
    'daño_ambiental',
    'peso_estimado',
  ],
} as const;
