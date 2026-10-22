package cl.duoc.coffeeflow.tests;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import cl.duoc.coffeeflow.base.BaseTest;

/**
 * CP-19 - CU-16 Endurecimiento de la sesion (RNF-05, RNF-06).
 *
 * HALLAZGO DE SEGURIDAD: la sesion es solo el flag coffeeflow_logged='true' en localStorage y las
 * credenciales (admin/1234) estan embebidas en el JavaScript del cliente. CP-19.1 y CP-19.3 FALLAN
 * mientras no exista una autenticacion verificable en servidor (token firmado, hash de clave).
 */
@DisplayName("CP-19 Seguridad de la sesion")
class CP19SeguridadSesionTest extends BaseTest {

    @Test
    @DisplayName("CP-19.1 Manipular coffeeflow_logged='true' sin login no debe dar acceso al Dashboard")
    void flagManipuladoNoDaAcceso() {
        ejecutarScript("localStorage.setItem('coffeeflow_logged', 'true');");
        driver.get(baseUrl + "/dashboard");

        boolean bloqueado;
        try {
            new WebDriverWait(driver, Duration.ofSeconds(4)).until(ExpectedConditions.urlContains("/login"));
            bloqueado = true;
        } catch (TimeoutException e) {
            bloqueado = false;
        }
        capturarEvidencia("CP-19_1_flag_manipulado");
        assertTrue(bloqueado, "Con solo escribir coffeeflow_logged='true' en localStorage se accedio a "
                + driver.getCurrentUrl() + " (sesion no verificable)");
    }

    @Test
    @DisplayName("CP-19.2 El campo contrasena oculta el texto ingresado (type=password)")
    void campoContrasenaOculto() {
        String tipo = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("password")))
                .getAttribute("type");

        capturarEvidencia("CP-19_2_campo_password");
        assertEquals("password", tipo);
    }

    @Test
    @DisplayName("CP-19.3 Las credenciales no deben estar embebidas en el JavaScript publico")
    void credencialesNoEmbebidasEnElCliente() {
        Object resultado = ((org.openqa.selenium.JavascriptExecutor) driver).executeAsyncScript(
                "const listo = arguments[arguments.length - 1];"
                        // scripts iniciales + chunks cargados de forma diferida (lazy loading)
                        + "const urls = [...new Set([...document.scripts].map(s => s.src).filter(Boolean)"
                        + "  .concat(performance.getEntriesByType('resource').map(e => e.name)"
                        + "  .filter(n => /\\.m?js(\\?|$)/.test(n))))];"
                        + "Promise.all(urls.map(u => fetch(u).then(r => r.text())))"
                        + "  .then(textos => listo(textos.some(t => /usuario\\s*===\\s*['\"]admin['\"]/.test(t)"
                        + "      && /password\\s*===\\s*['\"]1234['\"]/.test(t))))"
                        + "  .catch(e => listo('error: ' + e));");
        boolean expuestas = Boolean.TRUE.equals(resultado);
        capturarEvidencia("CP-19_3_credenciales_cliente");
        assertFalse(expuestas, "El codigo descargado por el navegador contiene la comparacion "
                + "usuario === 'admin' && password === '1234' (resultado: " + resultado + ")");
    }
}
