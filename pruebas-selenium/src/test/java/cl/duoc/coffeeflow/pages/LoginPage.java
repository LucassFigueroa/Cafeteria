package cl.duoc.coffeeflow.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/** Page Object de la pantalla /login. */
public class LoginPage {

    private static final By CAMPO_USUARIO = By.id("usuario");
    private static final By CAMPO_PASSWORD = By.id("password");
    private static final By BOTON_INGRESAR = By.cssSelector("button.login-button");

    private final WebDriver driver;
    private final WebDriverWait wait;

    public LoginPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void iniciarSesion(String usuario, String password) {
        escribir(CAMPO_USUARIO, usuario);
        escribir(CAMPO_PASSWORD, password);
        driver.findElement(BOTON_INGRESAR).click();
        wait.until(ExpectedConditions.urlContains("/dashboard"));
    }

    private void escribir(By localizador, String texto) {
        WebElement campo = wait.until(ExpectedConditions.visibilityOfElementLocated(localizador));
        campo.clear();
        campo.sendKeys(texto);
    }
}
