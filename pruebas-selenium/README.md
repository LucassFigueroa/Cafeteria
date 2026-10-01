# CoffeeFlow – Pruebas JUnit 5 + Selenium

Casos automatizados del plan de pruebas:

| Clase | Caso | Escenarios |
|---|---|---|
| `CP14ConfirmarVentaTest` | CP-14 Confirmar venta | 14.1 registra la venta y descuenta stock · 14.2 persiste tras recargar |
| `CP15ValidacionVentaTest` | CP-15 Validaciones de la venta | 15.1 no supera el stock · 15.2 producto inactivo / carrito vacío |

## Ejecutar

1. Levantar el front: `cd front` → `npm start` (queda en http://localhost:4200).
2. En otra terminal: `cd pruebas-selenium` → `mvn test`
   - Sin ventana de Chrome: `mvn test -Dheadless=true`
   - Otra URL: `mvn test -DbaseUrl=http://localhost:4200`

Requisitos: Java 17+, Maven y Google Chrome (Selenium Manager descarga el driver solo).
Las capturas quedan en `target/evidencias/` y los reportes en `target/surefire-reports/`.
