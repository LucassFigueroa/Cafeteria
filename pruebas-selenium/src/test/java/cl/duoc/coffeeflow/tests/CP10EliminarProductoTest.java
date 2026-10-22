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
import cl.duoc.coffeeflow.pages.MenuLateral;
import cl.duoc.coffeeflow.pages.ProductosPage;

/**
 * CP-10 - CU-08 Eliminar producto (RF-12).
 * La eliminacion solicita confirmacion y solo borra si el usuario confirma.
 */
@DisplayName("CP-10 Eliminar producto")
class CP10EliminarProductoTest extends BaseTest {

    private ProductosPage productos;

    @BeforeEach
    void abrirProductos() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
        new MenuLateral(driver, wait).ir("/productos");
        productos = new ProductosPage(driver, wait);
    }

    @Test
    @DisplayName("CP-10.1 Cancelar la confirmacion no elimina 'Espresso'")
    void cancelarNoElimina() {
        String pregunta = productos.eliminar("Espresso", false);

        capturarEvidencia("CP-10_1_cancelar");
        assertAll("Cancelar eliminacion",
                () -> assertEquals("¿Deseas eliminar \"Espresso\"?", pregunta),
                () -> assertTrue(productos.existe("Espresso")),
                () -> assertEquals(8, productos.nombresListados().size()));
    }

    @Test
    @DisplayName("CP-10.2 Aceptar la confirmacion elimina 'Espresso' del listado y de localStorage")
    void aceptarElimina() {
        productos.eliminar("Espresso", true);

        Boolean enAlmacenamiento = (Boolean) ejecutarScript(
                "return JSON.parse(localStorage.getItem('coffeeflow_productos')).some(p => p.nombre === 'Espresso');");
        capturarEvidencia("CP-10_2_aceptar");
        assertAll("Eliminacion confirmada",
                () -> assertFalse(productos.existe("Espresso")),
                () -> assertEquals(7, productos.nombresListados().size()),
                () -> assertFalse(enAlmacenamiento, "Tambien se elimina de localStorage"));
    }
}
