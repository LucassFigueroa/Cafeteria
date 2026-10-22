package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.LoginPage;
import cl.duoc.coffeeflow.pages.NuevaVentaPage;

/**
 * CP-13 - CU-11 Calcular totales de la venta (RF-18, RNF-11).
 * Subtotal por item = precio x cantidad; total = suma de subtotales, en formato CLP.
 */
@DisplayName("CP-13 Calculo de totales")
class CP13CalculoTotalesTest extends BaseTest {

    @Test
    @DisplayName("CP-13.1 2 Cappuccino + 1 Croissant: subtotales $5.000 y $1.900, total $6.900")
    void calculaSubtotalesYTotal() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
        NuevaVentaPage venta = new NuevaVentaPage(driver, wait).abrir();

        venta.agregarProducto("Cappuccino", 2);
        venta.agregarProducto("Croissant", 1);

        capturarEvidencia("CP-13_1_totales");
        assertAll("Calculo y formato CLP",
                () -> assertEquals("$5.000", venta.subtotalEnCarrito("Cappuccino"), "2 x $2.500"),
                () -> assertEquals("$1.900", venta.subtotalEnCarrito("Croissant"), "1 x $1.900"),
                () -> assertEquals("$6.900", venta.total(), "Suma de subtotales"));
    }
}
