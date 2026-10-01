package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.LoginPage;
import cl.duoc.coffeeflow.pages.NuevaVentaPage;

/**
 * CP-14 - CU-12 Confirmar venta (RF-19, RF-24, RNF-13).
 * Al confirmar la venta se descuenta el stock, se registra la transaccion y se persiste.
 */
@DisplayName("CP-14 Confirmar venta")
class CP14ConfirmarVentaTest extends BaseTest {

    private static final String PRODUCTO = "Cappuccino";
    private static final int STOCK_INICIAL = 20;
    private static final int CANTIDAD = 2;

    private NuevaVentaPage venta;

    @BeforeEach
    void prepararVenta() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
        venta = new NuevaVentaPage(driver, wait).abrir();
    }

    @Test
    @DisplayName("CP-14.1 Confirmar 2 Cappuccino registra la venta y descuenta el stock")
    void confirmarVentaRegistraTransaccionYDescuentaStock() {
        assertEquals(STOCK_INICIAL, venta.stockMostrado(PRODUCTO), "Stock inicial del producto demo");

        venta.agregarProducto(PRODUCTO, CANTIDAD);
        assertAll("Carrito antes de confirmar",
                () -> assertEquals(CANTIDAD, venta.cantidadEnCarrito(PRODUCTO)),
                () -> assertEquals("$5.000", venta.total()));
        capturarEvidencia("CP-14_1_carrito");

        venta.confirmarVenta();

        String mensaje = venta.mensaje();
        capturarEvidencia("CP-14_1_venta_confirmada");
        assertAll("Resultado de la venta",
                () -> assertTrue(mensaje.matches("Venta #\\d+ registrada correctamente\\."),
                        "Mensaje recibido: " + mensaje),
                () -> assertTrue(venta.mensajeEsExito(), "El mensaje debe mostrarse como exito"),
                () -> assertEquals(0, venta.itemsEnCarrito(), "El carrito debe quedar vacio"),
                () -> assertEquals(STOCK_INICIAL - CANTIDAD, venta.stockMostrado(PRODUCTO),
                        "El stock debe descontarse (20 - 2 = 18)"));
    }

    @Test
    @DisplayName("CP-14.2 La venta y el stock actualizado persisten tras recargar el navegador")
    void ventaYStockPersistenTrasRecargar() {
        venta.agregarProducto(PRODUCTO, CANTIDAD);
        venta.confirmarVenta();
        venta.mensaje();

        driver.navigate().refresh();
        venta = new NuevaVentaPage(driver, wait);

        Long cantidadVentas = (Long) ejecutarScript(
                "return JSON.parse(localStorage.getItem('coffeeflow_ventas')).length;");
        Long totalUltimaVenta = (Long) ejecutarScript(
                "return JSON.parse(localStorage.getItem('coffeeflow_ventas'))[0].total;");
        Long stockGuardado = (Long) ejecutarScript(
                "return JSON.parse(localStorage.getItem('coffeeflow_productos'))"
                        + ".find(p => p.nombre === arguments[0]).stock;", PRODUCTO);

        capturarEvidencia("CP-14_2_tras_recarga");
        assertAll("Persistencia en localStorage",
                () -> assertEquals(STOCK_INICIAL - CANTIDAD, venta.stockMostrado(PRODUCTO),
                        "La grilla muestra el stock actualizado tras recargar"),
                () -> assertEquals(STOCK_INICIAL - CANTIDAD, stockGuardado.intValue()),
                () -> assertEquals(4, cantidadVentas.intValue(), "3 ventas demo + la nueva venta"),
                () -> assertEquals(5000, totalUltimaVenta.intValue(), "Total de la venta registrada"));
    }
}
