package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.LoginPage;
import cl.duoc.coffeeflow.pages.MenuLateral;
import cl.duoc.coffeeflow.pages.ProductosPage;

/**
 * CP-08 - CU-06 Registrar producto (RF-15).
 * Validaciones del formulario: nombre obligatorio, precio &gt;= 1 y stock &gt;= 0.
 * Particion de equivalencia y valores limite.
 */
@DisplayName("CP-08 Validaciones del formulario de producto")
class CP08ValidacionProductoTest extends BaseTest {

    private ProductosPage productos;

    @BeforeEach
    void abrirFormulario() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
        new MenuLateral(driver, wait).ir("/productos");
        productos = new ProductosPage(driver, wait);
        productos.abrirNuevo();
    }

    @ParameterizedTest(name = "CP-08.{index} {0}: no guarda y marca el campo {4}")
    @CsvSource({
            "Nombre vacio,       '',      1000, 5,  nombre",
            "Precio 0,           Prueba,  0,    5,  precio",
            "Precio negativo,    Prueba,  -100, 5,  precio",
            "Stock negativo,     Prueba,  1000, -1, stock"
    })
    void entradasInvalidasNoSeGuardan(String caso, String nombre, String precio, String stock, String campo) {
        productos.completarFormulario(nombre, "Otro", precio, stock, true);
        productos.guardar();

        Long guardados = (Long) ejecutarScript(
                "return JSON.parse(localStorage.getItem('coffeeflow_productos')).length;");
        capturarEvidencia("CP-08_" + campo + "_" + caso.replace(' ', '_'));
        assertAll(caso,
                () -> assertTrue(productos.modalAbierto(), "El modal sigue abierto"),
                () -> assertTrue(productos.campoInvalido(campo), "El campo " + campo + " se marca invalido"),
                () -> assertEquals(8, guardados.intValue(), "No se agrega ningun producto"));
    }

    @Test
    @DisplayName("CP-08.5 Valores limite validos (precio 1, stock 0) se guardan")
    void valoresLimiteValidosSeGuardan() {
        productos.completarFormulario("Producto limite", "Otro", "1", "0", true);
        productos.guardar();
        productos.esperarModalCerrado();

        capturarEvidencia("CP-08_5_limites_validos");
        assertAll("Valores limite inferiores",
                () -> assertEquals("$1", productos.precio("Producto limite")),
                () -> assertEquals(0, productos.stock("Producto limite")));
    }
}
