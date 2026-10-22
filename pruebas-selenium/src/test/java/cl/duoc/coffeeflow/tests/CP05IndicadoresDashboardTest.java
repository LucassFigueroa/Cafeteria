package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.DashboardPage;
import cl.duoc.coffeeflow.pages.LoginPage;

/**
 * CP-05 - CU-04 Consultar indicadores del dia (RF-05, RF-06).
 * El Dashboard muestra el total recaudado y la cantidad de ventas del dia en curso.
 */
@DisplayName("CP-05 Indicadores del Dashboard")
class CP05IndicadoresDashboardTest extends BaseTest {

    @Test
    @DisplayName("CP-05.1 Con las 3 ventas demo del dia muestra $16.100 y 3 ventas")
    void totalesDelDia() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
        DashboardPage dashboard = new DashboardPage(driver, wait);

        capturarEvidencia("CP-05_1_indicadores_dia");
        assertAll("Indicadores del dia (6.900 + 5.000 + 4.200)",
                () -> assertEquals("$16.100", dashboard.ventasDeHoy()),
                () -> assertEquals(3, dashboard.ventasRealizadas()),
                () -> assertEquals("8", dashboard.productosRegistrados()));
    }

    @Test
    @DisplayName("CP-05.2 Un dia sin ventas muestra $0 y 0 ventas sin errores (valor limite)")
    void diaSinVentas() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
        sembrarDatos("coffeeflow_ventas",
                "[{\"id\":1001,\"fecha\":\"2020-01-15T10:00:00\",\"total\":2500,\"items\":[]}]");
        DashboardPage dashboard = new DashboardPage(driver, wait);

        capturarEvidencia("CP-05_2_dia_sin_ventas");
        assertAll("Dia sin ventas",
                () -> assertEquals("$0", dashboard.ventasDeHoy()),
                () -> assertEquals(0, dashboard.ventasRealizadas()));
    }
}
