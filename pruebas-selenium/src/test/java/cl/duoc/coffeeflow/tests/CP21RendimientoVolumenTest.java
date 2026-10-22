package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.LoginPage;

/**
 * CP-21 - Rendimiento con volumen de datos (RNF-02).
 * Con 500 ventas y 200 productos almacenados, cada vista debe cargar y responder en menos de 2 s.
 * Complementa las pruebas de carga JMeter: en esta SPA el procesamiento ocurre en el navegador.
 */
@DisplayName("CP-21 Rendimiento con 500 ventas y 200 productos")
class CP21RendimientoVolumenTest extends BaseTest {

    private static final long LIMITE_MS = 2000;

    @Test
    @DisplayName("CP-21.1 Dashboard, Productos, Nueva venta y Reportes cargan en menos de 2 s")
    void vistasCarganEnMenosDeDosSegundos() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
        ejecutarScript(
                "const cat = ['Café', 'Té', 'Pastelería', 'Sándwich', 'Bebida'];"
                        + "const productos = Array.from({ length: 200 }, (_, i) => ({ id: i + 1,"
                        + "  nombre: 'Producto ' + (i + 1), categoria: cat[i % 5], precio: 1000 + i * 10,"
                        + "  stock: 50 + i, activo: true }));"
                        + "const ventas = Array.from({ length: 500 }, (_, i) => { const n = 500 - i;"
                        + "  const d = new Date(); d.setDate(d.getDate() - (i % 28));"
                        + "  const f = d.toISOString().substring(0, 10) + 'T10:' + String(i % 60).padStart(2, '0') + ':00';"
                        + "  return { id: 1000 + n, fecha: f, total: 5000, items: ["
                        + "    { productoId: (i % 200) + 1, nombre: 'Producto ' + ((i % 200) + 1), cantidad: 2,"
                        + "      precioUnitario: 2500, subtotal: 5000 }] }; });"
                        + "localStorage.setItem('coffeeflow_productos', JSON.stringify(productos));"
                        + "localStorage.setItem('coffeeflow_ventas', JSON.stringify(ventas));");

        Map<String, Long> tiempos = new LinkedHashMap<>();
        long inicio = System.nanoTime();
        driver.navigate().refresh();
        wait.until(ExpectedConditions.numberOfElementsToBe(By.cssSelector(".stat-card strong"), 4));
        tiempos.put("Dashboard (recarga completa)", (System.nanoTime() - inicio) / 1_000_000);

        tiempos.put("Productos (200 filas)", medir("/productos", "section.products-card tbody tr", 200));
        tiempos.put("Nueva venta (200 tarjetas)", medir("/ventas", "article.product-card", 200));
        tiempos.put("Reportes (mes en curso)", medir("/reportes", "section.report-card tbody tr", 1));

        // Respuesta de la interfaz: filtrar 200 productos al escribir en el buscador
        driver.findElement(By.cssSelector("a[href='/productos']")).click();
        wait.until(ExpectedConditions.numberOfElementsToBe(By.cssSelector("section.products-card tbody tr"), 200));
        inicio = System.nanoTime();
        driver.findElement(By.cssSelector(".toolbar .search input")).sendKeys("Producto 19");
        wait.until(ExpectedConditions.numberOfElementsToBe(By.cssSelector("section.products-card tbody tr"), 11));
        tiempos.put("Busqueda en Productos", (System.nanoTime() - inicio) / 1_000_000);

        capturarEvidencia("CP-21_1_volumen_datos");
        System.out.println("CP-21 tiempos (ms): " + tiempos);
        tiempos.forEach((vista, ms) ->
                assertTrue(ms < LIMITE_MS, vista + " tardo " + ms + " ms (limite " + LIMITE_MS + " ms)"));
    }

    private long medir(String ruta, String selector, int minimo) {
        long inicio = System.nanoTime();
        driver.findElement(By.cssSelector("a[href='" + ruta + "']")).click();
        wait.until(ExpectedConditions.numberOfElementsToBeMoreThan(By.cssSelector(selector), minimo - 1));
        return (System.nanoTime() - inicio) / 1_000_000;
    }
}
