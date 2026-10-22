package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.LoginPage;
import cl.duoc.coffeeflow.pages.NuevaVentaPage;

/**
 * CP-12 - CU-10 Armar carrito de venta (RF-16, RF-17).
 * Se agregan productos respetando el stock y se ajustan cantidades con + / - / quitar.
 */
@DisplayName("CP-12 Armar carrito de venta")
class CP12CarritoVentaTest extends BaseTest {

    private static final String MUFFIN = "Muffin de chocolate";

    private NuevaVentaPage venta;

    @BeforeEach
    void abrirVenta() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
        venta = new NuevaVentaPage(driver, wait).abrir();
    }

    @Test
    @DisplayName("CP-12.1 El boton + no supera el stock (4) del Muffin de chocolate")
    void incrementarRespetaElStock() {
        venta.agregarProducto(MUFFIN, 4);
        venta.incrementar(MUFFIN);

        String mensaje = venta.mensaje();
        capturarEvidencia("CP-12_1_limite_stock");
        assertAll("Limite de stock en el carrito",
                () -> assertEquals(4, venta.cantidadEnCarrito(MUFFIN)),
                () -> assertEquals("No hay más stock disponible.", mensaje),
                () -> assertEquals("$9.200", venta.total(), "4 x $2.300"));
    }

    @Test
    @DisplayName("CP-12.2 El boton - hasta 0 y el boton quitar retiran el item del carrito")
    void disminuirYQuitarItems() {
        venta.agregarProducto(MUFFIN, 2);
        venta.agregarProducto("Latte", 1);

        venta.disminuir(MUFFIN);
        assertEquals(1, venta.cantidadEnCarrito(MUFFIN));
        venta.disminuir(MUFFIN);
        capturarEvidencia("CP-12_2_disminuir_a_cero");
        assertEquals(1, venta.itemsEnCarrito(), "Al llegar a 0 el Muffin se quita del carrito");

        venta.quitar("Latte");
        capturarEvidencia("CP-12_2_carrito_vacio");
        assertAll("Carrito vacio",
                () -> assertEquals(0, venta.itemsEnCarrito()),
                () -> assertEquals("$0", venta.total()));
    }
}
