package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import cl.duoc.coffeeflow.base.BaseTest;
import cl.duoc.coffeeflow.pages.LoginPage;

/**
 * CP-02 - CU-01 Iniciar sesion (RF-02).
 * El sistema rechaza credenciales invalidas y campos obligatorios vacios sin iniciar sesion.
 */
@DisplayName("CP-02 Credenciales invalidas")
class CP02CredencialesInvalidasTest extends BaseTest {

    @Test
    @DisplayName("CP-02.1 Contrasena incorrecta muestra error y no inicia sesion")
    void contrasenaIncorrectaNoIniciaSesion() {
        LoginPage login = new LoginPage(driver, wait);
        login.intentarIniciarSesion("admin", "0000");

        String mensaje = login.mensajeError();
        capturarEvidencia("CP-02_1_credenciales_invalidas");
        assertAll("Rechazo de credenciales",
                () -> assertEquals("Usuario o contraseña incorrectos.", mensaje),
                () -> assertTrue(driver.getCurrentUrl().endsWith("/login"), "Debe permanecer en /login"),
                () -> assertNull(ejecutarScript("return localStorage.getItem('coffeeflow_logged');"),
                        "No debe registrarse la sesion"));
    }

    @Test
    @DisplayName("CP-02.2 Usuario vacio: el formulario no se envia")
    void usuarioVacioNoEnviaFormulario() {
        LoginPage login = new LoginPage(driver, wait);
        login.intentarIniciarSesion("", "1234");

        capturarEvidencia("CP-02_2_usuario_vacio");
        assertAll("Validacion de campo obligatorio",
                () -> assertTrue(login.campoMarcadoInvalido("usuario"), "El campo usuario queda marcado como invalido"),
                () -> assertFalse(login.hayMensajeError(), "No se evalua la autenticacion con campos vacios"),
                () -> assertTrue(driver.getCurrentUrl().endsWith("/login"), "Debe permanecer en /login"));
    }
}
