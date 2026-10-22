package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.LoginPage;
import cl.duoc.coffeeflow.pages.MenuLateral;

/**
 * CP-01 - CU-01 Iniciar sesion (RF-01).
 * Un usuario con credenciales validas se autentica y accede al Dashboard.
 */
@DisplayName("CP-01 Inicio de sesion exitoso")
class CP01LoginExitosoTest extends BaseTest {

    @Test
    @DisplayName("CP-01.1 admin / 1234 autentica, registra la sesion y redirige a /dashboard")
    void credencialesValidasIngresanAlDashboard() {
        new LoginPage(driver, wait).iniciarSesion("admin", "1234");

        capturarEvidencia("CP-01_1_login_exitoso");
        assertAll("Inicio de sesion",
                () -> assertTrue(driver.getCurrentUrl().endsWith("/dashboard"), "URL: " + driver.getCurrentUrl()),
                () -> assertEquals("true", ejecutarScript("return localStorage.getItem('coffeeflow_logged');")),
                () -> assertTrue(new MenuLateral(driver, wait).visible(), "Se muestra el menu de la aplicacion"));
    }
}
