package cl.duoc.coffeeflow.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/** Page Object de la pantalla /login. */
public class LoginPage {

    private static final By CAMPO_USUARIO = By.id("usuario");
    private static final By CAMPO_PASSWORD = By.id("password");
    private static final By BOTON_INGRESAR = By.cssSelector("button.login-button");
    private static final By MENSAJE_ERROR = By.cssSelector("div.login-error");

    private final WebDriver driver;
    private final WebDriverWait wait;

    public LoginPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void iniciarSesion(String usuario, String password) {
        intentarIniciarSesion(usuario, password);
        wait.until(ExpectedConditions.urlContains("/dashboard"));
    }

    /** Completa el formulario y presiona el boton, sin asumir que el ingreso sera exitoso. */
    public void intentarIniciarSesion(String usuario, String password) {
        escribir(CAMPO_USUARIO, usuario);
        escribir(CAMPO_PASSWORD, password);
        driver.findElement(BOTON_INGRESAR).click();
    }

    public String mensajeError() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(MENSAJE_ERROR)).getText().trim();
    }

    public boolean hayMensajeError() {
        return !driver.findElements(MENSAJE_ERROR).isEmpty();
    }

    public boolean campoMarcadoInvalido(String id) {
        String clases = driver.findElement(By.id(id)).getAttribute("class");
        return clases != null && clases.contains("ng-invalid");
    }

    private void escribir(By localizador, String texto) {
        WebElement campo = wait.until(ExpectedConditions.visibilityOfElementLocated(localizador));
        // Ctrl+A + Retroceso dispara el evento "input" que escucha el formulario reactivo de Angular
        // (WebElement.clear() no actualiza el modelo y el campo conservaria el valor por defecto).
        campo.sendKeys(Keys.chord(Keys.CONTROL, "a"), Keys.BACK_SPACE);
        campo.sendKeys(texto);
    }
}
