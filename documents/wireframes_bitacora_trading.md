
# 📘 Wireframes Textuales – MVP Bitácora de Trading

---

## 1. 🧾 Trade Log (Diario de Operaciones)

### Pantalla Principal: Listado de Operaciones

```
+-------------------------------------------------------------------------------------+
| [🔍 Buscar por símbolo...]  [📁 Filtrar por estrategia ▼]  [➕ Añadir Trade]         |
+-------------------------------------------------------------------------------------+

| Fecha       | Símbolo | Tipo | P/L   | Estrategia | Confianza | [Editar] [Eliminar] |
|-------------|---------|------|-------|------------|-----------|---------------------|
| 2025-06-01  | AAPL    | Buy  | +120$ | Breakout   | Alta      | [✏️] [🗑️]            |
| 2025-06-03  | BTCUSD  | Sell | -50$  | Reversión  | Media     | [✏️] [🗑️]            |
+-------------------------------------------------------------------------------------+
```

### Modal: Añadir Nuevo Trade

```
+------------------------------------ NUEVO TRADE ------------------------------------+
| Símbolo:           [__________]                                                     |
| Fecha y hora:      [__/__/____] [__:__]                                             |
| Tipo de orden:     ( ) Buy   ( ) Sell                                               |
| Tamaño (qty):      [__________]                                                     |
| Precio de entrada: [__________]                                                     |
| Comisiones:        [__________] (opcional)                                          |

| Estrategia:        [dropdown ▼]                                                     |
| Tipo de mercado:   [dropdown ▼] (Forex / Crypto / Acciones / Índices / etc)         |
| Nivel de confianza:[Alta ▼ / Media / Baja]                                          |

| Descripción del trade:                                                              |
| [Área de texto amplia: ¿Por qué abriste este trade? Qué veías en el mercado?]      |

| Notas breves:                                                                       |
| [Área de texto más pequeña: comentarios post-trade o técnicos]                     |

| Archivos adjuntos: [Seleccionar archivo...] (📎 jpg / png / mp4) (máx. 3)           |

                                                 [💾 Guardar Trade]  [✖ Cancelar]      |
+--------------------------------------------------------------------------------------+
```

---

## 2. 📊 Dashboard

### Resumen General de Desempeño

```
+------------------------------------------------------------+
| Rango de fechas: [Últimos 7 días ▼]  [Estrategia ▼]        |
+------------------------------------------------------------+

[📈 Equity Curve (Gráfico de línea)]

+-------------------------+    +-------------------------+
| P&L Total:   $1,250     |    | Operaciones:    36       |
+-------------------------+    +-------------------------+
| Win Rate:    61.1%      |    | Trade Promedio: +$35     |
+-------------------------+    +-------------------------+

(💡 Tooltip con métricas adicionales si se desea)
```

---

## 3. 📈 Análisis

### Métricas por Estrategia / Cuenta de trading

```
+---------------------------------------------+
| [Dropdown: Elegir tipo de análisis ▼]       |
+---------------------------------------------+

Tabla:
| Estrategia   | # Trades | Win Rate | P&L Total |
|--------------|----------|----------|-----------|
| Breakout     | 14       | 71%      | +$650     |
| Reversión    | 10       | 40%      | -$120     |
| Pullback     | 12       | 66%      | +$400     |
+---------------------------------------------+
```

### Histograma de P/L por Operación

```
[📊 Gráfico de barras horizontal]
Eje X: Rango de P/L (en $)
Eje Y: Número de trades en ese rango
→ Posible agrupamiento: -100, -50, 0, +50, +100...
```

---

## 4. ⚙️ Configuración

```
+--------------------------- PREFERENCIAS ----------------------------+

| Divisa base:        [USD ▼]                                         |
| Huso horario:       [GMT-3 ▼]                                       |
| Tema visual:        ( ) Claro   (●) Oscuro                          |
| Idioma interfaz:    [Español ▼]                                     |

[🧪 Guardar configuración]
```
