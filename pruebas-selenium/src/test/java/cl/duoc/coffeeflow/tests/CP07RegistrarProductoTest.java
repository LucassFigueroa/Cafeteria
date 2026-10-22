package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.LoginPage;
import cl.duoc.coffeeflow.pages.MenuLateral;
import cl.duoc.coffeeflow.pages.ProductosPage;

/**
 * CP-07 - CU-06 Registrar producto (RF-09, RF-10).
 * El alta de un producto valido lo agrega al inicio del listado y lo persiste.
 */
@DisplayName("CP-07 Registrar producto")
class CP07RegistrarProductoTest extends BaseTest {

    @Test
    @DisplayName("CP-07.1 Registrar 'Chai Latte' (Te, $3.200, stock 10) lo agrega al inicio del listado")
    void registrarProductoValido() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
        new MenuLateral(driver, wait).ir("/productos");
        ProductosPage productos = new ProductosPage(driver, wait);

        productos.abrirNuevo();
        productos.completarFormulario("Chai Latte", "Té", "3200", "10", true);
        capturarEvidencia("CP-07_1_formulario");
        productos.guardar();
        productos.esperarModalCerrado();

        Long guardados = (Long) ejecutarScript(
                "return JSON.parse(localStorage.getItem('coffeeflow_productos')).length;");
        capturarEvidencia("CP-07_1_producto_registrado");
        assertAll("Producto registrado",
                () -> assertEquals("Chai Latte", productos.nombresListados().get(0), "Se agrega al inicio"),
                () -> assertEquals("Té", productos.categoria("Chai Latte")),
                () -> assertEquals("$3.200", productos.precio("Chai Latte")),
                () -> assertEquals(10, productos.stock("Chai Latte")),
                () -> assertEquals("Activo", productos.estado("Chai Latte")),
                () -> assertFalse(productos.modalAbierto(), "El modal se cierra"),
                () -> assertEquals(9, guardados.intValue(), "8 productos demo + el nuevo en localStorage"));
    }
}
