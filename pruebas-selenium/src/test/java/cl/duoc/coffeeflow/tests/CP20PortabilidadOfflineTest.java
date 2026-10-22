package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.openqa.selenium.chromium.HasCdp;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.LoginPage;
import cl.duoc.coffeeflow.pages.MenuLateral;
import cl.duoc.coffeeflow.pages.NuevaVentaPage;
import cl.duoc.coffeeflow.pages.ReportesPage;

/**
 * CP-20 - CU-17 Portabilidad y operacion offline (RNF-03, RNF-04, RNF-10).
 * El flujo login -> venta -> reporte funciona en Chrome y Edge, y sin conexion una vez cargada la app.
 * (Firefox no esta instalado en el equipo de pruebas; queda fuera del alcance automatizado.)
 */
@DisplayName("CP-20 Portabilidad y operacion offline")
class CP20PortabilidadOfflineTest extends BaseTest {

    @ParameterizedTest(name = "CP-20.1 Flujo completo login -> venta -> reporte en {0}")
    @ValueSource(strings = {"chrome", "edge"})
    void flujoCompletoEnNavegador(String navegador) {
        if (!"chrome".equals(navegador)) {
            driver.quit();
            usarNavegador(crearNavegador(navegador));
        }

        String mensaje = flujoVentaYReporte();
        capturarEvidencia("CP-20_1_flujo_" + navegador);
        assertTrue(mensaje.matches("Venta #1004 registrada correctamente\\."), navegador + ": " + mensaje);
    }

    @Test
    @DisplayName("CP-20.2 Sin conexion (tras la primera carga) se registra una venta y se consulta el reporte")
    void operacionSinConexion() {
        flujoVentaYReporte();

        HasCdp cdp = (HasCdp) driver;
        cdp.executeCdpCommand("Network.enable", Map.of());
        cdp.executeCdpCommand("Network.emulateNetworkConditions", Map.of(
                "offline", true, "latency", 0, "downloadThroughput", 0, "uploadThroughput", 0));
        boolean sinRed = Boolean.FALSE.equals(ejecutarScript("return navigator.onLine;"));

        String mensaje = flujoVentaYReporte();
        ReportesPage reportes = new ReportesPage(driver, wait);
        capturarEvidencia("CP-20_2_offline");
        assertAll("Operacion offline",
                () -> assertTrue(sinRed, "El navegador debe estar en modo sin conexion"),
                () -> assertEquals("Venta #1005 registrada correctamente.", mensaje),
                () -> assertEquals(5, reportes.cantidadVentas(), "3 demo + 2 ventas registradas"));
    }

    /** Ejecuta login (si hace falta) -> venta de 1 Espresso -> reporte del dia. Devuelve el mensaje de la venta. */
    private String flujoVentaYReporte() {
        if (driver.getCurrentUrl().endsWith("/login")) {
            new LoginPage(driver, wait).iniciarSesion("admin", "1234");
        }
        NuevaVentaPage venta = new NuevaVentaPage(driver, wait).abrir();
        venta.agregarProducto("Espresso", 1);
        venta.confirmarVenta();
        String mensaje = venta.mensaje();

        new MenuLateral(driver, wait).ir("/reportes");
        new ReportesPage(driver, wait).consultarHoy();
        return mensaje;
    }
}
