package cl.duoc.coffeeflow.pages;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

/** Page Object de la pantalla /productos (listado + modal de producto). */
public class ProductosPage {

    private static final By FILAS = By.cssSelector("section.products-card tbody tr");
    private static final By FILA_VACIA = By.cssSelector("section.products-card td.empty");
    private static final By BOTON_NUEVO = By.cssSelector(".page-header .primary-button");
    private static final By BUSCADOR = By.cssSelector(".toolbar .search input");
    private static final By FILTRO_CATEGORIA = By.cssSelector(".toolbar select");
    private static final By MODAL = By.cssSelector("section.modal");
    private static final By BOTON_GUARDAR = By.cssSelector("section.modal button[type='submit']");

    private final WebDriver driver;
    private final WebDriverWait wait;

    public ProductosPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
        wait.until(ExpectedConditions.visibilityOfElementLocated(BUSCADOR));
    }

    // ---------------------------------------------------------------- listado

    public List<String> nombresListados() {
        if (!driver.findElements(FILA_VACIA).isEmpty()) {
            return List.of();
        }
        return driver.findElements(FILAS).stream()
                .map(fila -> fila.findElement(By.cssSelector(".product-name strong")).getText().trim())
                .collect(Collectors.toList());
    }

    public boolean listadoVacio() {
        return !driver.findElements(FILA_VACIA).isEmpty();
    }

    public List<String> categoriasListadas() {
        return driver.findElements(By.cssSelector("section.products-card tbody span.category")).stream()
                .map(e -> e.getText().trim())
                .collect(Collectors.toList());
    }

    public String precio(String nombre) {
        return fila(nombre).findElement(By.cssSelector("td.price")).getText().trim();
    }

    public int stock(String nombre) {
        return Integer.parseInt(fila(nombre).findElement(By.cssSelector("span.stock")).getText().trim());
    }

    public String estado(String nombre) {
        return fila(nombre).findElement(By.cssSelector("span.status")).getText().trim();
    }

    public String categoria(String nombre) {
        return fila(nombre).findElement(By.cssSelector("span.category")).getText().trim();
    }

    public boolean existe(String nombre) {
        return buscarFila(nombre).isPresent();
    }

    public void buscar(String texto) {
        WebElement campo = driver.findElement(BUSCADOR);
        campo.sendKeys(Keys.chord(Keys.CONTROL, "a"), Keys.BACK_SPACE);
        campo.sendKeys(texto);
    }

    public void filtrarCategoria(String categoria) {
        new Select(driver.findElement(FILTRO_CATEGORIA)).selectByVisibleText(categoria);
    }

    // ---------------------------------------------------------------- acciones de fila

    public void editar(String nombre) {
        fila(nombre).findElement(By.cssSelector("button.edit")).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(MODAL));
    }

    /** Presiona eliminar y responde el cuadro de confirmacion nativo del navegador. */
    public String eliminar(String nombre, boolean aceptar) {
        fila(nombre).findElement(By.cssSelector("button.delete")).click();
        var alerta = wait.until(ExpectedConditions.alertIsPresent());
        String texto = alerta.getText();
        if (aceptar) {
            alerta.accept();
        } else {
            alerta.dismiss();
        }
        return texto;
    }

    // ---------------------------------------------------------------- modal

    public void abrirNuevo() {
        driver.findElement(BOTON_NUEVO).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(MODAL));
    }

    public void completarFormulario(String nombre, String categoria, String precio, String stock, boolean activo) {
        escribir("nombre", nombre);
        new Select(campo("categoria")).selectByValue(categoria);
        escribir("precio", precio);
        escribir("stock", stock);
        WebElement check = campo("activo");
        if (check.isSelected() != activo) {
            check.click();
        }
    }

    public void escribir(String control, String valor) {
        WebElement campo = campo(control);
        // Ctrl+A + Retroceso dispara el evento "input" que escucha el formulario reactivo de Angular
        campo.sendKeys(Keys.chord(Keys.CONTROL, "a"), Keys.BACK_SPACE);
        campo.sendKeys(valor);
    }

    public String valorCampo(String control) {
        return campo(control).getAttribute("value");
    }

    public boolean campoInvalido(String control) {
        String clases = campo(control).getAttribute("class");
        return clases != null && clases.contains("ng-invalid");
    }

    public void guardar() {
        driver.findElement(BOTON_GUARDAR).click();
    }

    public boolean modalAbierto() {
        return !driver.findElements(MODAL).isEmpty();
    }

    public void esperarModalCerrado() {
        wait.until(ExpectedConditions.invisibilityOfElementLocated(MODAL));
    }

    public String tituloModal() {
        return driver.findElement(By.cssSelector("section.modal h2")).getText().trim();
    }

    private WebElement campo(String control) {
        return driver.findElement(By.cssSelector("section.modal [formcontrolname='" + control + "']"));
    }

    private WebElement fila(String nombre) {
        return buscarFila(nombre)
                .orElseThrow(() -> new IllegalStateException("Producto no encontrado en el listado: " + nombre));
    }

    private Optional<WebElement> buscarFila(String nombre) {
        return driver.findElements(FILAS).stream()
                .filter(f -> !f.findElements(By.cssSelector(".product-name strong")).isEmpty())
                .filter(f -> f.findElement(By.cssSelector(".product-name strong")).getText().trim()
                        .equalsIgnoreCase(nombre))
                .findFirst();
    }
}
