package cl.duoc.coffeeflow.pages;

import java.util.List;
import java.util.stream.Collectors;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/** Page Object de la pantalla /reportes. */
public class ReportesPage {

    private static final By CAMPOS_FECHA = By.cssSelector(".filters input[type='date']");
    private static final By BOTON_BUSCAR = By.cssSelector("button.search-button");
    private static final By BOTON_HOY = By.cssSelector("button.today-button");
    private static final By METRICAS = By.cssSelector(".stats strong");
    private static final By FILAS_VENTA = By.cssSelector("section.report-card tbody tr:not(.detail-row)");
    private static final By FILA_VACIA = By.cssSelector("section.report-card td.empty");

    private final WebDriver driver;
    private final WebDriverWait wait;

    public ReportesPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
        wait.until(ExpectedConditions.numberOfElementsToBe(CAMPOS_FECHA, 2));
    }

    /**
     * Fija el rango (formato aaaa-mm-dd) y presiona Buscar. El valor se asigna por script y se
     * dispara el evento "input" porque el formato de tecleo de input[type=date] depende del idioma.
     */
    public void consultar(String desde, String hasta) {
        List<WebElement> campos = driver.findElements(CAMPOS_FECHA);
        asignarFecha(campos.get(0), desde);
        asignarFecha(campos.get(1), hasta);
        driver.findElement(BOTON_BUSCAR).click();
    }

    public void consultarHoy() {
        driver.findElement(BOTON_HOY).click();
    }

    public int cantidadVentas() {
        return Integer.parseInt(metrica(0));
    }

    public String ingresos() {
        return metrica(1);
    }

    public int productosVendidos() {
        return Integer.parseInt(metrica(2));
    }

    public String masVendido() {
        return metrica(3);
    }

    public boolean sinResultados() {
        return !driver.findElements(FILA_VACIA).isEmpty();
    }

    public int filasVenta() {
        return sinResultados() ? 0 : driver.findElements(FILAS_VENTA).size();
    }

    /** Valores de la columna indicada (0 = Venta, 1 = Fecha, 2 = Hora, 3 = Productos, 4 = Total). */
    public List<String> columna(int indice) {
        if (sinResultados()) {
            return List.of();
        }
        return driver.findElements(FILAS_VENTA).stream()
                .map(f -> f.findElements(By.tagName("td")).get(indice).getText().trim())
                .collect(Collectors.toList());
    }

    /** Expande el detalle de la venta indicada (por ejemplo "#1003") y devuelve sus lineas. */
    public List<String> verDetalle(String idVenta) {
        WebElement fila = driver.findElements(FILAS_VENTA).stream()
                .filter(f -> f.findElement(By.tagName("td")).getText().trim().equals(idVenta))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Venta no listada: " + idVenta));
        fila.findElement(By.cssSelector("button.detail-button")).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".detail-item")));
        return driver.findElements(By.cssSelector(".detail-item")).stream()
                .map(e -> e.getText().replaceAll("\\s+", " ").trim())
                .collect(Collectors.toList());
    }

    private String metrica(int indice) {
        return driver.findElements(METRICAS).get(indice).getText().trim();
    }

    private void asignarFecha(WebElement campo, String valor) {
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].value = arguments[1];"
                        + "arguments[0].dispatchEvent(new Event('input', { bubbles: true }));",
                campo, valor);
    }
}
