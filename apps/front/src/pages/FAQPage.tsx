import { ArrowLeft, HelpCircle, Recycle, Truck, Gift, Leaf, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    category: "Reciclaje",
    icon: Recycle,
    questions: [
      {
        question: "¿Qué materiales puedo reciclar con EcoGiro?",
        answer: "Puedes reciclar plástico (PET, HDPE, LDPE, PP), papel, cartón, vidrio y metal (aluminio, acero). Usa el escáner de la app para identificar si un material es reciclable."
      },
      {
        question: "¿Cómo debo preparar los materiales para reciclar?",
        answer: "Los materiales deben estar limpios, secos y sin restos de comida. Aplasta las botellas y cajas para ahorrar espacio. Separa los materiales por tipo si es posible."
      },
      {
        question: "¿Puedo reciclar materiales sucios o mojados?",
        answer: "No, los materiales contaminados con comida o líquidos no pueden ser reciclados. Asegúrate de enjuagar los envases antes de reciclarlos."
      }
    ]
  },
  {
    category: "Recolección",
    icon: Truck,
    questions: [
      {
        question: "¿Cómo funciona la recolección a domicilio?",
        answer: "Agenda una recolección desde la app, indica la dirección y el tipo de materiales. Nuestro equipo pasará a recogerlos en la fecha seleccionada."
      },
      {
        question: "¿Cuánto tiempo tarda la recolección?",
        answer: "Las recolecciones se programan dentro de los próximos 3-5 días hábiles, dependiendo de la disponibilidad y tu zona."
      },
      {
        question: "¿Hay un mínimo de materiales para agendar recolección?",
        answer: "Se recomienda tener al menos 2 kg de material reciclable para hacer eficiente la recolección, pero no hay un mínimo obligatorio."
      }
    ]
  },
  {
    category: "Puntos y Recompensas",
    icon: Gift,
    questions: [
      {
        question: "¿Cómo gano EcoPuntos?",
        answer: "Ganas puntos por cada kilo de material reciclado. El valor varía según el tipo de material: plástico (100 pts/kg), papel (80 pts/kg), vidrio (60 pts/kg), metal (120 pts/kg)."
      },
      {
        question: "¿Dónde puedo canjear mis puntos?",
        answer: "Puedes canjear tus EcoPuntos en la sección 'Recompensas' de la app por descuentos en tiendas aliadas, productos ecológicos o donaciones a causas ambientales."
      },
      {
        question: "¿Los puntos expiran?",
        answer: "Los puntos tienen validez de 12 meses desde la fecha en que fueron obtenidos. Te notificaremos cuando estén próximos a vencer."
      }
    ]
  },
  {
    category: "Impacto Ambiental",
    icon: Leaf,
    questions: [
      {
        question: "¿Cómo se calcula mi impacto ambiental?",
        answer: "Calculamos el CO2 evitado basándonos en el peso y tipo de material reciclado. Por ejemplo, 1 kg de plástico reciclado evita aproximadamente 1.5 kg de CO2."
      },
      {
        question: "¿A dónde van mis materiales reciclados?",
        answer: "Los materiales son procesados en centros de acopio certificados y luego enviados a plantas de reciclaje donde se transforman en nuevos productos."
      }
    ]
  },
  {
    category: "Centros de Acopio",
    icon: MapPin,
    questions: [
      {
        question: "¿Puedo llevar mis materiales directamente a un centro?",
        answer: "¡Sí! Puedes ubicar los centros de acopio cercanos en la sección 'Mapa' de la app y llevar tus materiales directamente."
      },
      {
        question: "¿Los centros de acopio tienen horario?",
        answer: "Cada centro tiene su propio horario. Consulta los horarios específicos en el detalle de cada centro dentro de la app."
      }
    ]
  }
];

export default function FAQPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-center gap-4 z-50">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors"
          aria-label="Volver"
          type="button"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-display font-semibold text-foreground">Preguntas frecuentes</h1>
      </header>

      <div className="px-5 py-6 space-y-6 pb-24">

        {/* FAQ Categories */}
        <div className="space-y-4">
          {faqs.map((category, index) => (
            <section 
              key={category.category} 
              className="eco-card animate-fade-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-eco-green-light flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-display font-semibold text-foreground">{category.category}</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-2">
                {category.questions.map((faq, qIndex) => (
                  <AccordionItem 
                    key={qIndex} 
                    value={`${category.category}-${qIndex}`}
                    className="border-b border-border last:border-b-0"
                  >
                    <AccordionTrigger className="text-left text-sm font-medium py-3 hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        {/* Contact CTA */}
        <section className="eco-card text-center animate-fade-up" style={{ animationDelay: "300ms" }}>
          <HelpCircle className="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 className="font-display font-semibold text-foreground mb-2">¿No encontraste tu respuesta?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Contáctanos y te ayudaremos con cualquier duda
          </p>
          <a 
            href="mailto:soporte@ecogiro.co" 
            className="inline-block bg-primary text-primary-foreground font-medium px-6 py-2 rounded-full text-sm"
          >
            Escribir a soporte
          </a>
        </section>
      </div>
    </div>
  );
}
