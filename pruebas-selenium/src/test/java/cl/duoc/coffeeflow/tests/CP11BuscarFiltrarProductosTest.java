package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.LoginPage;
import cl.duoc.coffeeflow.pages.MenuLateral;
import cl.duoc.coffeeflow.pages.ProductosPage;

/**
 * CP-11 - CU-09 Buscar y filtrar productos (RF-13, RF-14).
 * Busqueda parcial sin distinguir mayusculas, filtro por categoria y combinacion de ambos.
 */
@DisplayName("CP-11 Buscar y filtrar productos")
class CP11BuscarFiltrarProductosTest extends BaseTest {

    @Test
    @DisplayName("CP-11.1 Busqueda 'capp'/'CAPP', filtro 'Café' y combinacion 'cro' + 'Café' sin resultados")
    void busquedaYFiltroCombinados() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
        new MenuLateral(driver, wait).ir("/productos");
        ProductosPage productos = new ProductosPage(driver, wait);

        productos.buscar("capp");
        List<String> minusculas = productos.nombresListados();
        productos.buscar("CAPP");
        List<String> mayusculas = productos.nombresListados();
        capturarEvidencia("CP-11_1_busqueda");

        productos.buscar("");
        productos.filtrarCategoria("Café");
        List<String> categorias = productos.categoriasListadas();
        capturarEvidencia("CP-11_1_filtro_categoria");

        productos.buscar("cro");
        boolean vacio = productos.listadoVacio();
        capturarEvidencia("CP-11_1_combinado_vacio");

        assertAll("Busqueda y filtros",
                () -> assertEquals(List.of("Cappuccino"), minusculas),
                () -> assertEquals(minusculas, mayusculas, "La busqueda no distingue mayusculas"),
                () -> assertEquals(4, categorias.size(), "Hay 4 productos de categoria Café"),
                () -> assertTrue(categorias.stream().allMatch("Café"::equals)),
                () -> assertTrue(vacio, "Croissant es Pastelería: 'cro' + 'Café' no tiene resultados"));
    }
}
