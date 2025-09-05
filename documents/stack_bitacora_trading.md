
# 📄 Stack Tecnológico – Bitácora de Trading (Desktop)

**Versión:** MVP  
**Lenguaje principal:** TypeScript

---

## ⚙️ Arquitectura General

| Capa                     | Tecnología principal          | Descripción breve                                     |
|--------------------------|-------------------------------|--------------------------------------------------------|
| **Frontend (UI)**        | React + TailwindCSS + shadcn/ui | Interfaz declarativa, moderna, componetizada.         |
| **Estilo y componentes** | TailwindCSS + shadcn/ui       | Utilidades CSS + biblioteca de componentes accesibles |
| **Aplicación de escritorio** | Electron                     | Contenedor nativo multiplataforma (Win, Mac, Linux)    |
| **Persistencia local**   | SQLite                        | Base de datos local ligera y embebida                  |
| **ORM/Query Layer**      | Prisma / Drizzle (opcional)   | Capa de acceso a datos en caso de usar TypeScript ORM |
| **Manejo de estado**     | Zustand / Redux / Context     | Para coordinar datos globales (según complejidad)      |

---

## 🧩 Estructura Propuesta de Carpetas

\`\`\`
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
├── electron-builder.config.js
└── tsconfig.json
\`\`\`

---

## 📚 Tecnologías Detalladas

### 🖥 Electron

- Crea una aplicación nativa con Node.js + Chromium.
- Acceso a sistema de archivos para guardar capturas, adjuntos, base de datos.
- Comunicación entre **Main** y **Renderer** usando `preload.ts`.

### ⚛ React

- SPA con arquitectura moderna.
- Recomendado usar **Vite** como bundler.

### 🎨 TailwindCSS + ShadCN

- Estilo utilitario CSS.
- `shadcn/ui`: componentes accesibles, altamente personalizables.

### 🗃 SQLite

- Base de datos embebida ideal para escritorio.
- Almacenamiento local, sin servidor.

### 🧠 ORM (opcional)

- **Prisma**: ORM robusto, fuertemente tipado.
- Alternativa: **Drizzle ORM**, más liviano.

### 📁 Multimedia Local

- Almacenamiento de archivos en `~/TradingTracker/media/`.
- Solo se guarda el path relativo en la base de datos.

---

## ✅ Configuraciones Adicionales

- **Lenguaje usado:** TypeScript en frontend y backend.
- **100% local:** No hay sincronización en la nube por ahora.
- **Análisis futuros:** Se puede considerar integración con librerías como `math.js` o un microservicio Python si es necesario.

---

*Última actualización: Junio 2025*
