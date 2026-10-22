# CoffeeFlow – Pruebas automatizadas JUnit 5 + Selenium WebDriver

Automatiza los 20 casos del plan de pruebas (CP-01 a CP-20) y CP-21 (rendimiento con volumen de datos, RNF-02).
Patrón Page Object: `LoginPage`, `MenuLateral`, `DashboardPage`, `ProductosPage`, `NuevaVentaPage`, `ReportesPage`.

| Clase | Caso | Escenarios |
|---|---|---|
| `CP01LoginExitosoTest` | CP-01 Inicio de sesión | admin / 1234 → /dashboard |
| `CP02CredencialesInvalidasTest` | CP-02 Credenciales inválidas | contraseña incorrecta · usuario vacío |
| `CP03CerrarSesionTest` | CP-03 Cerrar sesión | cierre · botón atrás (**falla: DEF-01**) |
| `CP04ControlAccesoTest` | CP-04 Acceso sin sesión | /productos, /ventas, /reportes (**falla: DEF-01**) |
| `CP05IndicadoresDashboardTest` | CP-05 Indicadores del día | ventas demo · día sin ventas |
| `CP06AlertasDashboardTest` | CP-06 Alertas | umbral de stock 4/5/6 · últimas 5 ventas |
| `CP07RegistrarProductoTest` | CP-07 Registrar producto | alta de Chai Latte |
| `CP08ValidacionProductoTest` | CP-08 Validaciones | 4 entradas inválidas · límites válidos |
| `CP09EditarProductoTest` | CP-09 Editar producto | precarga y persistencia |
| `CP10EliminarProductoTest` | CP-10 Eliminar producto | cancelar · aceptar |
| `CP11BuscarFiltrarProductosTest` | CP-11 Buscar y filtrar | texto, categoría y combinación |
| `CP12CarritoVentaTest` | CP-12 Carrito | tope de stock · − / quitar |
| `CP13CalculoTotalesTest` | CP-13 Totales | subtotales y total CLP |
| `CP14ConfirmarVentaTest` | CP-14 Confirmar venta | registro · persistencia |
| `CP15ValidacionVentaTest` | CP-15 Validaciones de venta | stock · inactivo / carrito vacío |
| `CP16ReporteVentasTest` | CP-16 Reportes | día · rango sin ventas · rango invertido |
| `CP17DatosCorruptosTest` | CP-17 Datos corruptos | recuperación (**falla: DEF-02**) |
| `CP18LocalizacionTest` | CP-18 Localización | CLP, fecha, hora (**falla: DEF-04**) |
| `CP19SeguridadSesionTest` | CP-19 Seguridad de sesión | flag manipulado y credenciales en el cliente (**fallan: DEF-05/06**) · type=password |
| `CP20PortabilidadOfflineTest` | CP-20 Portabilidad / offline | Chrome · Edge · sin conexión |
| `CP21RendimientoVolumenTest` | CP-21 Volumen de datos | 500 ventas y 200 productos < 2 s por vista |

Las pruebas que fallan evidencian defectos reales del sistema y deben pasar a verde al corregirlos.

## Ejecutar

1. Levantar el front: `cd front` → `npm start` (http://localhost:4200).
2. En otra terminal: `cd pruebas-selenium` → `mvn test`
   - Sin ventana: `mvn test -Dheadless=true`
   - En Edge: `mvn test -Dbrowser=edge`
   - Otra URL: `mvn test -DbaseUrl=http://localhost:4200`
   - Reporte HTML: `mvn surefire-report:report-only` → `target/reports/surefire.html`

Requisitos: Java 17+, Maven, Google Chrome (y Microsoft Edge para CP-20). Selenium Manager descarga los drivers.
Las capturas quedan en `target/evidencias/` y los reportes en `target/surefire-reports/`.
