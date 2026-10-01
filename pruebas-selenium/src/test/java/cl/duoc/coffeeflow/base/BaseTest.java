package cl.duoc.coffeeflow.base;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Configuracion comun de las pruebas Selenium de CoffeeFlow.
 *
 * Propiedades del sistema (opcionales):
 *  -DbaseUrl=http://localhost:4200   URL donde se sirve la aplicacion (ng serve)
 *  -Dheadless=true                   Ejecuta Chrome sin ventana
 *  -DchromeBinary=/ruta/a/chrome     Binario de Chrome alternativo
 */
public abstract class BaseTest {

    private static final String URL_POR_DEFECTO = "http://localhost:4200";
    private static final Path CARPETA_EVIDENCIAS = Paths.get("target", "evidencias");

    protected WebDriver driver;
    protected WebDriverWait wait;
    protected String baseUrl;

    @BeforeEach
    void iniciarNavegador() {
        baseUrl = propiedad("baseUrl", URL_POR_DEFECTO);

        ChromeOptions opciones = new ChromeOptions();
        opciones.addArguments("--window-size=1366,900", "--lang=es-CL");
        if (Boolean.parseBoolean(propiedad("headless", "false"))) {
            opciones.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage");
        }
        String binario = propiedad("chromeBinary", "");
        if (!binario.isEmpty()) {
            opciones.setBinary(binario);
        }

        driver = new ChromeDriver(opciones);
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        // Estado inicial conocido: se borra el almacenamiento local para que
        // la aplicacion cargue los productos y ventas de demostracion.
        driver.get(baseUrl + "/login");
        ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
        driver.navigate().refresh();
    }

    @AfterEach
    void cerrarNavegador() {
        if (driver != null) {
            driver.quit();
        }
    }

    /** Guarda una captura de pantalla en target/evidencias como respaldo de la ejecucion. */
    protected void capturarEvidencia(String nombre) {
        try {
            Files.createDirectories(CARPETA_EVIDENCIAS);
            Path origen = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE).toPath();
            Files.copy(origen, CARPETA_EVIDENCIAS.resolve(nombre + ".png"),
                    StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo guardar la evidencia " + nombre, e);
        }
    }

    protected Object ejecutarScript(String script, Object... argumentos) {
        return ((JavascriptExecutor) driver).executeScript(script, argumentos);
    }

    private static String propiedad(String clave, String porDefecto) {
        String valor = System.getProperty(clave);
        if (valor == null || valor.isBlank() || valor.startsWith("${")) {
            return porDefecto;
        }
        return valor;
    }
}
