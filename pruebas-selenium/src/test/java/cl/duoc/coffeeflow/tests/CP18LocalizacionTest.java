package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.DashboardPage;
import cl.duoc.coffeeflow.pages.LoginPage;
import cl.duoc.coffeeflow.pages.MenuLateral;
import cl.duoc.coffeeflow.pages.ReportesPage;

/**
 * CP-18 - CU-15 Localizacion de moneda y fecha (RNF-11).
 * Montos en CLP sin decimales, fechas dd-mm-aaaa y horas HH:mm.
 */
@DisplayName("CP-18 Localizacion de moneda y fecha")
class CP18LocalizacionTest extends BaseTest {

    @Test
    @DisplayName("CP-18.1 Montos $16.100, fecha dd-mm-aaaa y hora 11:20 en Dashboard y Reportes")
    void formatoMonedaFechaYHora() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
        DashboardPage dashboard = new DashboardPage(driver, wait);
        String total = dashboard.ventasDeHoy();
        List<String> horasDashboard = dashboard.columnaUltimasVentas(1);
        List<String> montosDashboard = dashboard.columnaUltimasVentas(3);
        capturarEvidencia("CP-18_1_dashboard");

        new MenuLateral(driver, wait).ir("/reportes");
        ReportesPage reportes = new ReportesPage(driver, wait);
        reportes.consultarHoy();
        List<String> fechas = reportes.columna(1);
        capturarEvidencia("CP-18_1_reportes");

        String hoy = LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        assertAll("Localizacion es-CL",
                () -> assertEquals("$16.100", total, "Separador de miles y sin decimales"),
                () -> assertEquals(List.of("$6.900", "$5.000", "$4.200"), montosDashboard),
                () -> assertTrue(fechas.stream().allMatch(hoy::equals), "Fechas dd-mm-aaaa: " + fechas),
                () -> assertEquals("11:20", horasDashboard.get(0), "Hora HH:mm de la venta #1003"));
    }
}
