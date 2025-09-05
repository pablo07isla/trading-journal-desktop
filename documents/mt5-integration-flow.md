# Integración MT5: Flujo Técnico y TODO LIST

## 🛠️ Flujo Técnico: Integración MT5 con Python .exe

1. **Script Python para MT5**
   - Desarrolla un script Python que utilice la API oficial de MetaTrader 5 (`MetaTrader5` package) para obtener:
     - Datos de la cuenta (número, broker, balance, equity, etc.).
     - Historial de trades cerrados (entry, SL, TP, fecha, hora, resultado, etc.).
   - El script debe aceptar parámetros (tipo de consulta) y devolver los datos en formato JSON por stdout.

2. **Empaquetado del Script**
   - Usa PyInstaller (o py2exe) para convertir el script Python en un ejecutable Windows (.exe) autónomo.
   - Verifica que el .exe incluya todas las dependencias necesarias.

3. **Distribución**
   - Incluye el .exe en la carpeta del proyecto Electron (`main/mt5-integration/`).
   - Asegúrate de que el instalador de la app lo copie al equipo del usuario.

4. **Invocación desde Electron**
   - En el main process de Electron, utiliza `child_process.spawn` o `execFile` para ejecutar el .exe.
   - Recoge la salida JSON y procesa los datos.

5. **Persistencia en SQLite**
   - Transforma los datos recibidos y guárdalos en la base de datos local usando los métodos de `db-manager.ts`.
   - Implementa métodos para importar/actualizar cuentas y trades.

6. **Exposición vía IPC**
   - Expón métodos IPC para:
     - Importar datos de MT5 manualmente.
     - Configurar actualización automática.
     - Consultar estado de la última importación.

7. **UI en React**
   - Agrega una página/tabla para mostrar cuentas y trades importados.
   - Añade botón "Actualizar" y estado de sincronización.
   - Muestra errores y feedback al usuario.

8. **Configuración**
   - Permite al usuario configurar la frecuencia de actualización automática y la ruta de MT5 si es necesario.

---

## ✅ TODO LIST para la implementación

1. **[ ] Desarrollar el script Python para obtener datos de MT5**
2. **[ ] Empaquetar el script como .exe con PyInstaller**
3. **[ ] Probar el .exe en distintos equipos Windows**
4. **[ ] Crear carpeta `main/mt5-integration/` y agregar el .exe**
5. **[ ] Implementar función en Electron main process para invocar el .exe y leer la salida**
6. **[ ] Procesar y guardar los datos en SQLite usando `db-manager.ts`**
7. **[ ] Exponer métodos IPC para importar y consultar datos MT5**
8. **[ ] Actualizar `preload.ts` para exponer la nueva API a la UI**
9. **[ ] Crear página y componentes React para mostrar y actualizar datos MT5**
10. **[ ] Añadir configuración de actualización automática/manual**
11. **[ ] Testear el flujo completo en modo desarrollo y distribución**
12. **[ ] Documentar el proceso y requisitos para el usuario
