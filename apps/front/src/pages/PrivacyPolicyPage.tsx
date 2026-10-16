import { ArrowLeft, Shield, Database, Eye, Lock, Share2, UserCheck, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sections = [
  {
    icon: Database,
    title: "Datos que Recopilamos",
    content: [
      "**Información de cuenta:** Nombre, correo electrónico, número de teléfono y dirección de recolección.",
      "**Datos de reciclaje:** Tipo y cantidad de materiales reciclados, historial de recolecciones y puntos acumulados.",
      "**Información de ubicación:** Dirección para programar recolecciones y acceso a centros de acopio cercanos.",
      "**Datos del dispositivo:** Información técnica para mejorar el funcionamiento de la aplicación."
    ]
  },
  {
    icon: Eye,
    title: "Uso de la Información",
    content: [
      "Gestionar tu cuenta y procesar recolecciones de materiales reciclables.",
      "Calcular y asignar EcoPuntos por tus actividades de reciclaje.",
      "Enviarte notificaciones sobre recolecciones, puntos y recompensas disponibles.",
      "Mejorar nuestros servicios y personalizar tu experiencia.",
      "Generar estadísticas anónimas sobre el impacto ambiental de nuestra comunidad."
    ]
  },
  {
    icon: Lock,
    title: "Protección de Datos",
    content: [
      "Utilizamos cifrado SSL/TLS para proteger la transmisión de datos.",
      "Almacenamos tu información en servidores seguros con acceso restringido.",
      "Implementamos medidas de seguridad técnicas y organizativas para prevenir accesos no autorizados.",
      "Realizamos auditorías periódicas de seguridad."
    ]
  },
  {
    icon: Share2,
    title: "Compartir Información",
    content: [
      "**Centros de acopio:** Compartimos tu dirección y materiales programados para las recolecciones.",
      "**Aliados comerciales:** Solo datos necesarios para el canje de recompensas, con tu consentimiento.",
      "**Autoridades:** Cuando sea requerido por ley o para proteger derechos legales.",
      "**Nunca vendemos** tu información personal a terceros."
    ]
  },
  {
    icon: UserCheck,
    title: "Tus Derechos",
    content: [
      "**Acceso:** Solicitar una copia de tus datos personales.",
      "**Rectificación:** Corregir información incorrecta o desactualizada.",
      "**Eliminación:** Solicitar la eliminación de tu cuenta y datos asociados.",
      "**Portabilidad:** Recibir tus datos en un formato estructurado.",
      "**Oposición:** Limitar el uso de tus datos para ciertos fines."
    ]
  }
];

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  const renderContent = (text: string) => {
    // Parse bold text marked with **
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => 
      index % 2 === 1 ? <strong key={index} className="text-foreground">{part}</strong> : part
    );
  };

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
        <h1 className="text-lg font-display font-semibold text-foreground">Política de datos</h1>
      </header>

      <div className="px-5 py-6 space-y-6 pb-24">

        {/* Intro */}
        <section className="eco-card animate-fade-up" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-eco-green-light flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-foreground">Tu Privacidad Importa</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            En EcoGiro nos comprometemos a proteger tu privacidad y datos personales. 
            Esta política explica qué información recopilamos, cómo la usamos y tus derechos 
            como usuario de nuestra plataforma.
          </p>
        </section>

        {/* Policy Sections */}
        {sections.map((section, index) => (
          <section 
            key={section.title}
            className="eco-card animate-fade-up"
            style={{ animationDelay: `${(index + 2) * 50}ms` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-eco-green-light flex items-center justify-center">
                <section.icon className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display font-semibold text-foreground">{section.title}</h2>
            </div>
            <ul className="space-y-3">
              {section.content.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1.5">•</span>
                  <span className="leading-relaxed">{renderContent(item)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Cookies */}
        <section className="eco-card animate-fade-up" style={{ animationDelay: "400ms" }}>
          <h2 className="font-display font-semibold text-foreground mb-3">Cookies y Tecnologías</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Utilizamos cookies y tecnologías similares para mejorar tu experiencia, 
            recordar tus preferencias y analizar el uso de la aplicación. Puedes 
            gestionar las cookies desde la configuración de tu dispositivo.
          </p>
        </section>

        {/* Contact */}
        <section className="eco-card text-center animate-fade-up" style={{ animationDelay: "450ms" }}>
          <Mail className="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 className="font-display font-semibold text-foreground mb-2">¿Tienes preguntas?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Si tienes dudas sobre esta política o quieres ejercer tus derechos, contáctanos:
          </p>
          <a 
            href="mailto:privacidad@ecogiro.co" 
            className="inline-block bg-primary text-primary-foreground font-medium px-6 py-2 rounded-full text-sm"
          >
            privacidad@ecogiro.co
          </a>
        </section>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground px-4">
          Al usar EcoGiro, aceptas esta política de datos. Nos reservamos el derecho de 
          actualizarla, notificándote de cambios significativos.
        </p>
      </div>
    </div>
  );
}
