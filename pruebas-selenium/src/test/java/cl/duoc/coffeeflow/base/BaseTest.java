package cl.duoc.coffeeflow.base;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.List;
import java.util.logging.Level;
import java.util.stream.Collectors;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.logging.LogEntry;
import org.openqa.selenium.logging.LogType;
import org.openqa.selenium.logging.LoggingPreferences;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Configuracion comun de las pruebas Selenium de CoffeeFlow.
 *
 * Propiedades del sistema (opcionales):
 *  -DbaseUrl=http://localhost:4200   URL donde se sirve la aplicacion (ng serve)
 *  -Dheadless=true                   Ejecuta el navegador sin ventana
 *  -Dbrowser=edge                    Ejecuta la suite en Microsoft Edge (por defecto chrome)
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
        usarNavegador(crearNavegador(propiedad("browser", "chrome")));
    }

    /** Crea un navegador "chrome" o "edge" con la configuracion comun de la suite. */
    protected static WebDriver crearNavegador(String navegador) {
        boolean headless = Boolean.parseBoolean(propiedad("headless", "false"));
        LoggingPreferences logs = new LoggingPreferences();
        logs.enable(LogType.BROWSER, Level.SEVERE);

        if ("edge".equalsIgnoreCase(navegador)) {
            EdgeOptions opciones = new EdgeOptions();
            opciones.addArguments("--window-size=1366,900", "--lang=es-CL");
            if (headless) {
                opciones.addArguments("--headless=new");
            }
            opciones.setCapability("ms:loggingPrefs", logs);
            return new EdgeDriver(opciones);
        }

        ChromeOptions opciones = new ChromeOptions();
        opciones.addArguments("--window-size=1366,900", "--lang=es-CL");
        if (headless) {
            opciones.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage");
        }
        opciones.setCapability("goog:loggingPrefs", logs);
        String binario = propiedad("chromeBinary", "");
        if (!binario.isEmpty()) {
            opciones.setBinary(binario);
        }
        return new ChromeDriver(opciones);
    }

    /**
     * Deja el navegador indicado como driver de la prueba, en un estado inicial conocido: se borra
     * el almacenamiento local para que la aplicacion cargue los productos y ventas de demostracion.
     */
    protected void usarNavegador(WebDriver nuevo) {
        driver = nuevo;
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        driver.get(baseUrl + "/login");
        ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
        driver.navigate().refresh();
    }

    /** Reemplaza el contenido de una clave de localStorage y recarga la aplicacion. */
    protected void sembrarDatos(String clave, String json) {
        ejecutarScript("localStorage.setItem(arguments[0], arguments[1]);", clave, json);
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

    /** Errores (SEVERE) registrados en la consola del navegador desde la ultima lectura. */
    protected List<String> erroresConsola() {
        return driver.manage().logs().get(LogType.BROWSER).getAll().stream()
                .map(LogEntry::getMessage)
                .collect(Collectors.toList());
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
