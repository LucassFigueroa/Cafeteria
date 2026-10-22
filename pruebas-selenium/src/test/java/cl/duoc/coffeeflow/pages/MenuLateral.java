package cl.duoc.coffeeflow.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/** Menu lateral (sidebar) presente en todos los modulos internos. */
public class MenuLateral {

    private static final By BOTON_CERRAR_SESION = By.cssSelector(".sidebar-bottom button");

    private final WebDriver driver;
    private final WebDriverWait wait;

    public MenuLateral(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    /** Navega con el enlace del menu ("/dashboard", "/productos", "/ventas" o "/reportes"). */
    public void ir(String ruta) {
        wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("a[href='" + ruta + "']"))).click();
        wait.until(ExpectedConditions.urlContains(ruta));
    }

    public void cerrarSesion() {
        wait.until(ExpectedConditions.elementToBeClickable(BOTON_CERRAR_SESION)).click();
        wait.until(ExpectedConditions.urlContains("/login"));
    }

    public boolean visible() {
        return !driver.findElements(BOTON_CERRAR_SESION).isEmpty();
    }
}
