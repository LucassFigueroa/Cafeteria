package cl.duoc.coffeeflow.pages;

import java.util.List;
import java.util.stream.Collectors;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/** Page Object de la pantalla /dashboard. */
public class DashboardPage {

    private static final By VALORES_TARJETAS = By.cssSelector(".stat-card strong");
    private static final By FILAS_ULTIMAS_VENTAS = By.cssSelector("section.recent tbody tr");

    private final WebDriver driver;

    public DashboardPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        wait.until(ExpectedConditions.numberOfElementsToBe(VALORES_TARJETAS, 4));
    }

    public String ventasDeHoy() {
        return tarjeta(0);
    }

    public String productosRegistrados() {
        return tarjeta(1);
    }

    public int stockBajo() {
        return Integer.parseInt(tarjeta(2));
    }

    public int ventasRealizadas() {
        return Integer.parseInt(tarjeta(3));
    }

    public int filasUltimasVentas() {
        return driver.findElements(FILAS_ULTIMAS_VENTAS).size();
    }

    /** Valores de la columna indicada (0 = Venta, 1 = Hora, 2 = Productos, 3 = Total). */
    public List<String> columnaUltimasVentas(int columna) {
        return driver.findElements(FILAS_ULTIMAS_VENTAS).stream()
                .map(fila -> fila.findElements(By.tagName("td")).get(columna).getText().trim())
                .collect(Collectors.toList());
    }

    private String tarjeta(int indice) {
        List<WebElement> valores = driver.findElements(VALORES_TARJETAS);
        return valores.get(indice).getText().trim();
    }
}
