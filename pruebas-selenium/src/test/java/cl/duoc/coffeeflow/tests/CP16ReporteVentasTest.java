package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.LoginPage;
import cl.duoc.coffeeflow.pages.MenuLateral;
import cl.duoc.coffeeflow.pages.ReportesPage;

/**
 * CP-16 - CU-13 Consultar reporte de ventas (RF-21, RF-22, RF-23).
 * Filtro por rango de fechas, metricas del periodo y detalle expandible.
 */
@DisplayName("CP-16 Reporte de ventas")
class CP16ReporteVentasTest extends BaseTest {

    private ReportesPage reportes;

    @BeforeEach
    void abrirReportes() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
        new MenuLateral(driver, wait).ir("/reportes");
        reportes = new ReportesPage(driver, wait);
    }

    @Test
    @DisplayName("CP-16.1 Rango hoy-hoy: 3 ventas, $16.100, 6 productos, mas vendido Cappuccino y detalle")
    void reporteDelDia() {
        reportes.consultarHoy();

        assertAll("Metricas del periodo",
                () -> assertEquals(3, reportes.cantidadVentas()),
                () -> assertEquals("$16.100", reportes.ingresos()),
                () -> assertEquals(6, reportes.productosVendidos()),
                () -> assertEquals("Cappuccino", reportes.masVendido()),
                () -> assertEquals(List.of("#1003", "#1002", "#1001"), reportes.columna(0),
                        "Ordenadas de la mas reciente a la mas antigua"));

        List<String> detalle = reportes.verDetalle("#1003");
        capturarEvidencia("CP-16_1_reporte_dia_detalle");
        assertEquals(List.of("2 × Cappuccino $5.000", "1 × Croissant $1.900"), detalle);
    }

    @Test
    @DisplayName("CP-16.2 Un rango de fechas futuras no tiene ventas: $0 y 'Sin datos'")
    void rangoSinVentas() {
        LocalDate futuro = LocalDate.now().plusYears(1);
        reportes.consultar(futuro.toString(), futuro.plusDays(30).toString());

        capturarEvidencia("CP-16_2_rango_sin_ventas");
        assertAll("Rango sin ventas",
                () -> assertTrue(reportes.sinResultados()),
                () -> assertEquals(0, reportes.cantidadVentas()),
                () -> assertEquals("$0", reportes.ingresos()),
                () -> assertEquals("Sin datos", reportes.masVendido()));
    }

    @Test
    @DisplayName("CP-16.3 Un rango invertido (desde > hasta) no muestra ventas")
    void rangoInvertido() {
        LocalDate hoy = LocalDate.now();
        reportes.consultar(hoy.plusDays(1).toString(), hoy.minusDays(1).toString());

        capturarEvidencia("CP-16_3_rango_invertido");
        assertAll("Rango invertido",
                () -> assertTrue(reportes.sinResultados()),
                () -> assertEquals(0, reportes.filasVenta()));
    }
}
