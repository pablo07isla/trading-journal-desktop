# Trading Journal Desktop

Aplicación de escritorio local para llevar un registro, análisis y optimización de operaciones de trading. Desarrollada para traders que buscan privacidad y control total sobre sus datos, sin depender de la nube.

---

## 🚀 Funcionalidades Principales

- **Registro de Operaciones:** Añade, edita y elimina trades con todos los campos relevantes (fecha, instrumento, tipo, resultado, notas, etc.).
- **Adjuntos Locales:** Guarda capturas de pantalla, imágenes y documentos asociados a cada operación. Los archivos se almacenan localmente y solo se guarda la ruta en la base de datos.
- **Visualización de Adjuntos:** Visualiza miniaturas de imágenes adjuntas y ábrelas en un modal tipo carrusel para verlas en grande y desplazarte entre ellas.
- **Gestión de Cuentas y Estrategias:** Administra múltiples cuentas de trading y estrategias personalizadas.
- **Dashboard Analítico:** Visualiza métricas clave y gráficos de desempeño.
- **Configuración Local:** Preferencias de usuario almacenadas localmente.
- **100% Offline:** Todos los datos y archivos permanecen en tu equipo.

---

## 🧑‍💻 Tecnologías y Frameworks

- **Electron:** Contenedor de escritorio multiplataforma (Windows, Mac, Linux).
- **React + TypeScript:** SPA moderna y fuertemente tipada para la UI.
- **TailwindCSS:** Utilidades CSS para estilos rápidos y consistentes.
- **shadcn/ui:** Componentes accesibles y personalizables para la interfaz.
- **SQLite (better-sqlite3):** Base de datos local embebida, sin servidor.
- **Vite:** Bundler rápido para el frontend.
- **IPC Seguro:** Toda la comunicación entre UI y base de datos se realiza mediante canales IPC y un preload seguro (`window.electronAPI`).

---

## 📁 Estructura del Proyecto

```
trading-journal-app/
├── main/                    # Proceso principal de Electron
│   ├── main.ts
│   ├── preload.ts
│   └── database/
│       ├── schema.sql
│       └── db-manager.ts
├── renderer/                # App React (UI)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── forms/
│   │   │   └── layout/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   └── App.tsx
│   ├── index.html
│   └── vite.config.ts
├── package.json
└── electron-builder.config.js
```

---

## ⚙️ Scripts Principales

- `npm run dev` – Desarrollo en caliente (Electron + Vite)
- `npm run build` – Compila main y renderer
- `npm run package` – Empaqueta la app para distribución
- `npm run dist` – Genera instalador

---

## 📚 Referencias y Documentación

- [Stack y arquitectura](../documents/stack_bitacora_trading.md)
- [Guía de implementación](../documents/implementacion_bitacora_trading.md)
- [MVP y wireframes](../documents/mvp_bitacora_trading.md)
- [Estándares de código](../.github/instructions/typescript-react.instructions.md)

---

**Desarrollado con ❤️ para traders. Todos los datos permanecen en tu equipo.**