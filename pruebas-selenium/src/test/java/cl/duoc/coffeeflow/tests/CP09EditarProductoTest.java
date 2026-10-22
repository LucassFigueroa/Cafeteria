package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.LoginPage;
import cl.duoc.coffeeflow.pages.MenuLateral;
import cl.duoc.coffeeflow.pages.ProductosPage;

/**
 * CP-09 - CU-07 Editar producto (RF-11).
 * La edicion precarga los datos y actualiza el producto en el listado y en el almacenamiento.
 */
@DisplayName("CP-09 Editar producto")
class CP09EditarProductoTest extends BaseTest {

    @Test
    @DisplayName("CP-09.1 Editar 'Latte' precarga el formulario y el cambio persiste tras recargar")
    void editarProductoPersiste() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
        new MenuLateral(driver, wait).ir("/productos");
        ProductosPage productos = new ProductosPage(driver, wait);

        productos.editar("Latte");
        assertAll("Formulario precargado",
                () -> assertEquals("Editar producto", productos.tituloModal()),
                () -> assertEquals("Latte", productos.valorCampo("nombre")),
                () -> assertEquals("2800", productos.valorCampo("precio")),
                () -> assertEquals("15", productos.valorCampo("stock")));
        capturarEvidencia("CP-09_1_precarga");

        productos.escribir("precio", "3000");
        productos.escribir("stock", "20");
        productos.guardar();
        productos.esperarModalCerrado();
        assertEquals("$3.000", productos.precio("Latte"), "El listado muestra el nuevo precio");

        driver.navigate().refresh();
        ProductosPage recargada = new ProductosPage(driver, wait);
        capturarEvidencia("CP-09_1_tras_recarga");
        assertAll("Persistencia tras recargar",
                () -> assertEquals("$3.000", recargada.precio("Latte")),
                () -> assertEquals(20, recargada.stock("Latte")),
                () -> assertEquals(8, recargada.nombresListados().size(), "No se duplica el producto"));
    }
}
