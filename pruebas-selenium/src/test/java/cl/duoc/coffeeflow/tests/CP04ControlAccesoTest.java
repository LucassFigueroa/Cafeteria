package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import cl.duoc.coffeeflow.base.BaseTest;

/**
 * CP-04 - CU-03 Control de acceso (RF-04, RNF-05).
 * El acceso directo por URL a un modulo interno sin sesion debe redirigir a /login.
 *
 * DEFECTO CONOCIDO: en app.routes.ts se declara "export const authGuard = () => true;",
 * que reemplaza al guard real (core/guards/auth.guard.ts). Se espera que esta prueba FALLE
 * hasta que se corrija el defecto.
 */
@DisplayName("CP-04 Control de acceso sin sesion")
class CP04ControlAccesoTest extends BaseTest {

    @ParameterizedTest(name = "CP-04 Acceso directo a {0} sin sesion redirige a /login")
    @ValueSource(strings = {"/productos", "/ventas", "/reportes"})
    void accesoSinSesionRedirigeAlLogin(String ruta) {
        // Sin sesion: BaseTest limpio el localStorage (no existe coffeeflow_logged)
        driver.get(baseUrl + ruta);

        boolean redirigido;
        try {
            new WebDriverWait(driver, Duration.ofSeconds(4)).until(ExpectedConditions.urlContains("/login"));
            redirigido = true;
        } catch (TimeoutException e) {
            redirigido = false;
        }
        capturarEvidencia("CP-04_acceso_sin_sesion" + ruta.replace('/', '_'));
        assertTrue(redirigido, "Se esperaba redireccion a /login, pero se mostro " + driver.getCurrentUrl()
                + " sin iniciar sesion (authGuard anulado en app.routes.ts)");
    }
}
