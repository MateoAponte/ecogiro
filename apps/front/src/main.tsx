import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeAuthSession } from './lib/auth-session';

const root = createRoot(document.getElementById('root')!);
root.render(
  <div
    role="status"
    className="min-h-screen bg-background flex items-center justify-center"
  >
    Cargando sesión...
  </div>,
);
void initializeAuthSession()
  .then(() => root.render(<App />))
  .catch(() => {
    root.render(
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p role="alert">
          No se pudo acceder al almacenamiento de sesión del dispositivo.
        </p>
        <button
          type="button"
          className="eco-button-primary"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>,
    );
  });
