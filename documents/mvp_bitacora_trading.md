
# 📘 MVP – Bitácora de Trading (Aplicación de Escritorio)

**Versión:** 1.0  
**Lenguaje:** TypeScript  
**Frameworks:** Electron + React + TailwindCSS + Shadcn/ui + SQLite  
**Fecha:** Junio 2025

---

## 🧾 Descripción de la Aplicación

La **Bitácora de Trading** es una aplicación de escritorio diseñada para ayudar a traders a registrar, analizar y optimizar su desempeño mediante el seguimiento detallado de cada operación. Es completamente local, sin necesidad de conexión a internet, ideal para mantener los datos personales y sensibles seguros y privados.

---

## 🔑 Funcionalidades Principales

1. **Diario de Operaciones (Trade Log):**
   - Registro manual de trades.
   - Campos: símbolo, tipo, tamaño, precio, estrategia, nivel de confianza, comisiones.
   - Descripción detallada del trade y notas adicionales.
   - Soporte para adjuntar screenshots o videos de la operación.
   - Filtros por fecha, símbolo, estrategia.

2. **Dashboard:**
   - Resumen gráfico de desempeño (curva de equity).
   - KPIs como P&L total, win rate, cantidad de operaciones, promedio por trade.
   - Filtros rápidos por fecha o estrategia.

3. **Análisis:**
   - Métricas agregadas por estrategia.
   - Histograma de resultados (P&L).
   - Evaluación de efectividad según tipo de mercado o confianza.

4. **Configuración:**
   - Divisa base.
   - Zona horaria.
   - Tema (claro/oscuro).
   - Idioma.

---

## 🧩 Modelo de Datos (Resumen)

### `trades`

Registra los detalles de cada operación.

| Campo         | Tipo      |
|---------------|-----------|
| id            | INTEGER   |
| symbol        | TEXT      |
| timestamp     | DATETIME  |
| order_type    | TEXT      |
| quantity      | REAL      |
| entry_price   | REAL      |
| commissions   | REAL      |
| strategy_id   | INTEGER   |
| market_type   | TEXT      |
| confidence    | TEXT      |
| description   | TEXT      |
| notes         | TEXT      |

### `strategies`

Lista de estrategias personalizadas.

| Campo | Tipo   |
|-------|--------|
| id    | INTEGER |
| name  | TEXT    |

### `attachments`

Archivos multimedia adjuntos a un trade.

| Campo      | Tipo   |
|------------|--------|
| id         | INTEGER |
| trade_id   | INTEGER |
| file_path  | TEXT    |
| file_type  | TEXT    |

### `user_settings`

Preferencias del usuario.

| Campo         | Tipo   |
|---------------|--------|
| id            | INTEGER |
| base_currency | TEXT    |
| timezone      | TEXT    |
| theme         | TEXT    |
| language      | TEXT    |

---

## 🚀 Objetivo del MVP

Crear una base sólida de aplicación de escritorio con:

- UI intuitiva y responsive.
- Persistencia local confiable.
- Flujo de registro y consulta de trades funcional.
- Dashboard con primeras métricas visuales.

---

*Este documento describe el alcance mínimo viable para lanzar la primera versión funcional de la aplicación.*
