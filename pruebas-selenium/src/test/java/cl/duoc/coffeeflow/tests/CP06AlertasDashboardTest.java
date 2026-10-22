package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.DashboardPage;
import cl.duoc.coffeeflow.pages.LoginPage;

/**
 * CP-06 - CU-05 Alertas del Dashboard (RF-07, RF-08).
 * Stock bajo (umbral &lt;= 5) y listado de las 5 ultimas ventas.
 */
@DisplayName("CP-06 Alertas del Dashboard")
class CP06AlertasDashboardTest extends BaseTest {

    @BeforeEach
    void iniciarSesion() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
    }

    @Test
    @DisplayName("CP-06.1 Stock bajo cuenta los productos con stock 4 y 5 pero no 6 (valores limite)")
    void umbralDeStockBajo() {
        sembrarDatos("coffeeflow_productos", "["
                + "{\"id\":1,\"nombre\":\"Muffin de chocolate\",\"categoria\":\"Pastelería\",\"precio\":2300,\"stock\":4,\"activo\":true},"
                + "{\"id\":2,\"nombre\":\"Producto limite\",\"categoria\":\"Otro\",\"precio\":1000,\"stock\":5,\"activo\":true},"
                + "{\"id\":3,\"nombre\":\"Producto\",\"categoria\":\"Otro\",\"precio\":1000,\"stock\":6,\"activo\":true}]");
        DashboardPage dashboard = new DashboardPage(driver, wait);

        capturarEvidencia("CP-06_1_stock_bajo");
        assertEquals(2, dashboard.stockBajo(), "Stock 4 y 5 cumplen la condicion <= 5; stock 6 no");
    }

    @Test
    @DisplayName("CP-06.2 Con 6 ventas registradas la tabla lista solo las 5 mas recientes")
    void ultimasCincoVentas() {
        String hoy = LocalDate.now().toString();
        StringBuilder ventas = new StringBuilder("[");
        for (int i = 6; i >= 1; i--) {
            ventas.append(String.format("{\"id\":%d,\"fecha\":\"%sT1%d:00:00\",\"total\":1000,\"items\":[]}%s",
                    1000 + i, hoy, i, i > 1 ? "," : ""));
        }
        sembrarDatos("coffeeflow_ventas", ventas.append("]").toString());
        DashboardPage dashboard = new DashboardPage(driver, wait);

        List<String> ids = dashboard.columnaUltimasVentas(0);
        capturarEvidencia("CP-06_2_ultimas_ventas");
        assertAll("Ultimas ventas",
                () -> assertEquals(5, dashboard.filasUltimasVentas()),
                () -> assertEquals(List.of("#1006", "#1005", "#1004", "#1003", "#1002"), ids),
                () -> assertEquals(6, dashboard.ventasRealizadas()));
    }
}
