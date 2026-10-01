package cl.duoc.coffeeflow.pages;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/** Page Object de la pantalla /ventas (Nueva venta). */
public class NuevaVentaPage {

    private static final By TARJETAS_PRODUCTO = By.cssSelector("article.product-card");
    private static final By ITEMS_CARRITO = By.cssSelector("article.cart-item");
    private static final By TOTAL = By.cssSelector(".cart-footer .total strong");
    private static final By BOTON_CONFIRMAR = By.cssSelector("button.confirm");
    private static final By MENSAJE = By.cssSelector("div.message");
    private static final By ENLACE_MENU_VENTAS = By.cssSelector("a[href='/ventas']");
    private static final Pattern NUMERO = Pattern.compile("(\\d+)");

    private final WebDriver driver;
    private final WebDriverWait wait;

    public NuevaVentaPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    /** Navega a Nueva venta usando el menu lateral (navegacion interna del SPA). */
    public NuevaVentaPage abrir() {
        wait.until(ExpectedConditions.elementToBeClickable(ENLACE_MENU_VENTAS)).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(TARJETAS_PRODUCTO));
        return this;
    }

    public void agregarProducto(String nombre, int veces) {
        for (int i = 0; i < veces; i++) {
            tarjeta(nombre).findElement(By.tagName("button")).click();
        }
    }

    public int stockMostrado(String nombre) {
        String texto = tarjeta(nombre).findElement(By.cssSelector(".product-info small")).getText();
        Matcher m = NUMERO.matcher(texto);
        if (!m.find()) {
            throw new IllegalStateException("No se encontro el stock en: " + texto);
        }
        return Integer.parseInt(m.group(1));
    }

    public boolean productoVisible(String nombre) {
        return driver.findElements(TARJETAS_PRODUCTO).stream()
                .anyMatch(t -> nombreDe(t).equalsIgnoreCase(nombre));
    }

    public int cantidadEnCarrito(String nombre) {
        for (WebElement item : driver.findElements(ITEMS_CARRITO)) {
            if (item.findElement(By.cssSelector(".cart-item-top strong")).getText().trim().equalsIgnoreCase(nombre)) {
                return Integer.parseInt(item.findElement(By.cssSelector(".quantity span")).getText().trim());
            }
        }
        return 0;
    }

    public int itemsEnCarrito() {
        return driver.findElements(ITEMS_CARRITO).size();
    }

    public String total() {
        return driver.findElement(TOTAL).getText().trim();
    }

    public boolean confirmarHabilitado() {
        return driver.findElement(BOTON_CONFIRMAR).isEnabled();
    }

    public void confirmarVenta() {
        driver.findElement(BOTON_CONFIRMAR).click();
    }

    public String mensaje() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(MENSAJE)).getText().trim();
    }

    public boolean mensajeEsExito() {
        String clases = driver.findElement(MENSAJE).getAttribute("class");
        return clases != null && clases.contains("success");
    }

    private WebElement tarjeta(String nombre) {
        List<WebElement> tarjetas = driver.findElements(TARJETAS_PRODUCTO);
        return tarjetas.stream()
                .filter(t -> nombreDe(t).equalsIgnoreCase(nombre))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Producto no encontrado en la grilla: " + nombre));
    }

    private static String nombreDe(WebElement tarjeta) {
        return tarjeta.findElement(By.tagName("h3")).getText().trim();
    }
}
