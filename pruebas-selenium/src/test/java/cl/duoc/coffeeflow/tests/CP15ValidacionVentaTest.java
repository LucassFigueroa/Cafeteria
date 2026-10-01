package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.LoginPage;
import cl.duoc.coffeeflow.pages.NuevaVentaPage;

/**
 * CP-15 - CU-12 Confirmar venta (RF-20, RNF-13).
 * El sistema impide ventas con stock insuficiente, de productos inactivos o con carrito vacio.
 */
@DisplayName("CP-15 Validaciones de la venta")
class CP15ValidacionVentaTest extends BaseTest {

    private NuevaVentaPage venta;

    @BeforeEach
    void iniciarSesion() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
    }

    @Test
    @DisplayName("CP-15.1 No permite vender mas unidades que el stock disponible")
    void noPermiteSuperarElStock() {
        String producto = "Muffin de chocolate";
        venta = new NuevaVentaPage(driver, wait).abrir();
        assertEquals(4, venta.stockMostrado(producto), "Stock demo del muffin");

        venta.agregarProducto(producto, 5);

        String mensaje = venta.mensaje();
        capturarEvidencia("CP-15_1_stock_insuficiente");
        assertAll("Control de stock en el carrito",
                () -> assertEquals(4, venta.cantidadEnCarrito(producto), "No debe superar el stock (4)"),
                () -> assertEquals("No queda más stock de Muffin de chocolate.", mensaje),
                () -> assertFalse(venta.mensajeEsExito(), "Debe mostrarse como error"));

        venta.confirmarVenta();
        venta.mensaje();
        capturarEvidencia("CP-15_1_stock_en_cero");
        assertEquals(0, venta.stockMostrado(producto), "El stock queda en 0 y nunca negativo (RNF-13)");
    }

    @Test
    @DisplayName("CP-15.2 Producto inactivo no se ofrece y no se confirma una venta vacia")
    void productoInactivoYCarritoVacio() {
        // Se desactiva "Te verde" directamente en el almacenamiento y se recarga la app.
        ejecutarScript(
                "const p = JSON.parse(localStorage.getItem('coffeeflow_productos'));"
                        + "p.find(x => x.nombre === 'Té verde').activo = false;"
                        + "localStorage.setItem('coffeeflow_productos', JSON.stringify(p));");
        driver.navigate().refresh();
        venta = new NuevaVentaPage(driver, wait).abrir();

        capturarEvidencia("CP-15_2_inactivo_y_carrito_vacio");
        assertAll("Reglas de negocio de la venta",
                () -> assertFalse(venta.productoVisible("Té verde"),
                        "Un producto inactivo no debe ofrecerse para la venta"),
                () -> assertTrue(venta.productoVisible("Cappuccino"), "Los productos activos se listan"),
                () -> assertEquals(0, venta.itemsEnCarrito(), "Carrito inicial vacio"),
                () -> assertFalse(venta.confirmarHabilitado(),
                        "No se puede confirmar una venta sin productos"));
    }
}
