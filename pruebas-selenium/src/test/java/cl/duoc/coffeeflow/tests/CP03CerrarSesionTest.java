package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.LoginPage;
import cl.duoc.coffeeflow.pages.MenuLateral;

/**
 * CP-03 - CU-02 Cerrar sesion (RF-03).
 * Al cerrar sesion se elimina el estado de autenticacion y no se puede volver con "atras".
 *
 * DEFECTO CONOCIDO: CP-03.2 FALLA por el mismo origen que CP-04 (authGuard anulado en app.routes.ts).
 */
@DisplayName("CP-03 Cerrar sesion")
class CP03CerrarSesionTest extends BaseTest {

    @BeforeEach
    void iniciarSesion() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");
    }

    @Test
    @DisplayName("CP-03.1 Cerrar sesion elimina coffeeflow_logged y redirige a /login")
    void cerrarSesionEliminaElEstado() {
        new MenuLateral(driver, wait).cerrarSesion();

        capturarEvidencia("CP-03_1_sesion_cerrada");
        assertAll("Cierre de sesion",
                () -> assertTrue(driver.getCurrentUrl().endsWith("/login")),
                () -> assertNull(ejecutarScript("return localStorage.getItem('coffeeflow_logged');")));
    }

    @Test
    @DisplayName("CP-03.2 Tras cerrar sesion, el boton atras no restaura el Dashboard")
    void botonAtrasNoRestauraLaSesion() {
        new MenuLateral(driver, wait).cerrarSesion();

        driver.navigate().back();
        boolean redirigido;
        try {
            new WebDriverWait(driver, Duration.ofSeconds(4)).until(ExpectedConditions.urlContains("/login"));
            redirigido = true;
        } catch (TimeoutException e) {
            redirigido = false;
        }
        capturarEvidencia("CP-03_2_boton_atras");
        assertTrue(redirigido, "Tras cerrar sesion, 'atras' mostro " + driver.getCurrentUrl()
                + " sin autenticacion (authGuard anulado en app.routes.ts)");
    }
}
