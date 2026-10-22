package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.LoginPage;

/**
 * CP-17 - CU-14 Recuperacion ante datos corruptos (RNF-09, RNF-13, RF-24).
 * Ante datos invalidos en localStorage la aplicacion debe recuperarse con los datos por defecto.
 *
 * DEFECTO CONOCIDO: CafeteriaService.cargarDatos() ejecuta JSON.parse(...) sin try/catch.
 * Se espera que esta prueba FALLE hasta que se corrija el defecto.
 */
@DisplayName("CP-17 Recuperacion ante datos corruptos")
class CP17DatosCorruptosTest extends BaseTest {

    @Test
    @DisplayName("CP-17.1 Con coffeeflow_productos corrupto la app carga el Dashboard con datos por defecto")
    void seRecuperaConDatosPorDefecto() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
        erroresConsola(); // descarta mensajes previos

        ejecutarScript("localStorage.setItem('coffeeflow_productos', '{dato-invalido');");
        driver.navigate().refresh();

        boolean dashboardVisible;
        try {
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("h1.page-title")));
            dashboardVisible = true;
        } catch (TimeoutException e) {
            dashboardVisible = false;
        }
        List<String> errores = erroresConsola();
        capturarEvidencia("CP-17_1_datos_corruptos");

        assertTrue(dashboardVisible,
                "La aplicacion no se recupero: el Dashboard no se mostro. Errores de consola: " + errores);
    }
}
