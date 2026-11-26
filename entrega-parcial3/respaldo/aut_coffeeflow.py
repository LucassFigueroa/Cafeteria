# -*- coding: utf-8 -*-
"""
Pruebas de Aceptación de Usuario (AUT) - CoffeeFlow
Actividad Formativa 3 - TCY0101 Técnicas de Calidad de Software

Ejecuta los 16 casos AUT del listado (RU = requerimientos de usuario,
RS = requerimientos del sistema, PN = procesos de negocio) con Selenium
WebDriver y deja, por ciclo, un resultados.json y las capturas de evidencia.

Uso:
    python aut_coffeeflow.py ciclo1 [--alfa http://localhost:4200] [--beta http://localhost:8080]
    python aut_coffeeflow.py ciclo1 --solo AUT-RU-01,AUT-RS-04

Ambientes:
    Alfa -> ng serve (ambiente QA controlado), por defecto http://localhost:4200
    Beta -> build de producción servido como sitio estático, por defecto http://localhost:8080
"""
import argparse
import datetime
import json
import re
import shutil
import tempfile
import time
import traceback
from pathlib import Path

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

ap = argparse.ArgumentParser()
ap.add_argument("ciclo")
ap.add_argument("--alfa", default="http://localhost:4200")
ap.add_argument("--beta", default="http://localhost:8080")
ap.add_argument("--solo", default="")
ap.add_argument("--ver", action="store_true", help="muestra el navegador (sin headless)")
ARGS = ap.parse_args()

ALFA, BETA = ARGS.alfa.rstrip("/"), ARGS.beta.rstrip("/")
OUT = Path(__file__).resolve().parent / "resultados" / ARGS.ciclo
EVID = OUT / "evidencias"
EVID.mkdir(parents=True, exist_ok=True)

CSS = By.CSS_SELECTOR


# --------------------------------------------------------------------------- utilidades
class Sesion:
    """Un navegador abierto sobre CoffeeFlow, con helpers de las pantallas."""

    def __init__(self, base, navegador="chrome", perfil=None, limpiar=True):
        self.base, self.nav = base, navegador
        o = webdriver.EdgeOptions() if navegador == "edge" else webdriver.ChromeOptions()
        o.add_argument("--window-size=1366,900")
        o.add_argument("--lang=es-CL")
        if not ARGS.ver:
            o.add_argument("--headless=new")
        if perfil:
            o.add_argument(f"--user-data-dir={perfil}")
        o.set_capability("ms:loggingPrefs" if navegador == "edge" else "goog:loggingPrefs",
                         {"browser": "SEVERE"})
        self.d = webdriver.Edge(options=o) if navegador == "edge" else webdriver.Chrome(options=o)
        self.w = WebDriverWait(self.d, 10)
        self.d.get(base + "/login")
        if limpiar:
            self.d.execute_script("localStorage.clear();")
            self.d.refresh()

    # ---- genéricos
    def cerrar(self):
        try:
            self.d.quit()
        except Exception:
            pass

    def ls(self, clave):
        return self.d.execute_script("return localStorage.getItem(arguments[0]);", clave)

    def set_ls(self, clave, valor):
        self.d.execute_script("localStorage.setItem(arguments[0], arguments[1]);", clave, valor)

    def shot(self, nombre):
        archivo = EVID / f"{nombre}.png"
        self.d.save_screenshot(str(archivo))
        return archivo.name

    def errores_consola(self):
        try:
            return [e["message"] for e in self.d.get_log("browser")]
        except Exception:
            return []

    def textos(self, sel, raiz=None):
        return [e.text.strip() for e in (raiz or self.d).find_elements(CSS, sel)]

    def visible(self, sel, t=10):
        return WebDriverWait(self.d, t).until(EC.visibility_of_element_located((CSS, sel)))

    def escribir(self, elem, texto):
        elem.send_keys(Keys.CONTROL, "a")
        elem.send_keys(Keys.BACK_SPACE)
        elem.send_keys(str(texto))

    def ruta_actual(self):
        return "/" + self.d.current_url.split("/", 3)[3] if self.d.current_url.count("/") >= 3 else "/"

    # ---- login / navegación
    def login(self, usuario="admin", clave="1234", esperar=True):
        self.escribir(self.visible("#usuario"), usuario)
        self.escribir(self.d.find_element(CSS, "#password"), clave)
        self.d.find_element(CSS, "button.login-button").click()
        if esperar:
            self.w.until(EC.url_contains("/dashboard"))
            self.esperar_dashboard()

    def menu(self, ruta):
        self.w.until(EC.element_to_be_clickable((CSS, f"a[href='{ruta}']"))).click()
        self.w.until(EC.url_contains(ruta))

    def cerrar_sesion(self):
        self.w.until(EC.element_to_be_clickable((CSS, ".sidebar-bottom button"))).click()
        self.w.until(EC.url_contains("/login"))

    # ---- dashboard
    def esperar_dashboard(self, t=10):
        WebDriverWait(self.d, t).until(lambda d: len(d.find_elements(CSS, ".stat-card strong")) == 4)

    def dashboard(self):
        self.esperar_dashboard()
        v = self.textos(".stat-card strong")
        filas = self.d.find_elements(CSS, "section.recent tbody tr")
        return {
            "ventas_hoy": v[0], "productos": v[1], "stock_bajo": v[2], "ventas_realizadas": v[3],
            "ultimas": [[td.text.strip() for td in f.find_elements(By.TAG_NAME, "td")] for f in filas],
            "texto": self.d.find_element(By.TAG_NAME, "main").text if self.d.find_elements(By.TAG_NAME, "main")
            else self.d.find_element(By.TAG_NAME, "body").text,
        }

    # ---- productos
    def filas_productos(self):
        self.visible(".toolbar .search input")
        res = {}
        for f in self.d.find_elements(CSS, "section.products-card tbody tr"):
            n = f.find_elements(CSS, ".product-name strong")
            if n:
                res[n[0].text.strip()] = {
                    "precio": f.find_element(CSS, "td.price").text.strip(),
                    "stock": f.find_element(CSS, "span.stock").text.strip(),
                    "estado": f.find_element(CSS, "span.status").text.strip(),
                    "categoria": f.find_element(CSS, "span.category").text.strip(),
                    "fila": f,
                }
        return res

    def campo_modal(self, control):
        return self.d.find_element(CSS, f"section.modal [formcontrolname='{control}']")

    def completar_producto(self, nombre=None, categoria=None, precio=None, stock=None, activo=None):
        if nombre is not None:
            self.escribir(self.campo_modal("nombre"), nombre)
        if categoria is not None:
            Select(self.campo_modal("categoria")).select_by_value(categoria)
        if precio is not None:
            self.escribir(self.campo_modal("precio"), precio)
        if stock is not None:
            self.escribir(self.campo_modal("stock"), stock)
        if activo is not None:
            chk = self.campo_modal("activo")
            if chk.is_selected() != activo:
                chk.click()

    def nuevo_producto(self, **datos):
        self.d.find_element(CSS, ".page-header .primary-button").click()
        self.visible("section.modal")
        self.completar_producto(**datos)

    def guardar_modal(self):
        self.d.find_element(CSS, "section.modal button[type='submit']").click()

    def modal_abierto(self):
        return bool(self.d.find_elements(CSS, "section.modal"))

    def esperar_modal_cerrado(self):
        self.w.until(EC.invisibility_of_element_located((CSS, "section.modal")))

    def editar_producto(self, nombre):
        self.filas_productos()[nombre]["fila"].find_element(CSS, "button.edit").click()
        self.visible("section.modal")

    def eliminar_producto(self, nombre, aceptar=True):
        self.filas_productos()[nombre]["fila"].find_element(CSS, "button.delete").click()
        alerta = self.w.until(EC.alert_is_present())
        texto = alerta.text
        alerta.accept() if aceptar else alerta.dismiss()
        return texto

    # ---- nueva venta
    def tarjeta(self, nombre):
        self.visible("article.product-card")
        for t in self.d.find_elements(CSS, "article.product-card"):
            if t.find_element(By.TAG_NAME, "h3").text.strip().lower() == nombre.lower():
                return t
        return None

    def productos_venta(self):
        self.visible("article.product-card")
        return [t.find_element(By.TAG_NAME, "h3").text.strip() for t in self.d.find_elements(CSS, "article.product-card")]

    def agregar(self, nombre, veces=1):
        for _ in range(veces):
            self.tarjeta(nombre).find_element(By.TAG_NAME, "button").click()

    def boton_agregar_habilitado(self, nombre):
        return self.tarjeta(nombre).find_element(By.TAG_NAME, "button").is_enabled()

    def stock_tarjeta(self, nombre):
        m = re.search(r"(-?\d+)", self.tarjeta(nombre).find_element(CSS, ".product-info small").text)
        return int(m.group(1)) if m else None

    def cantidad_carrito(self, nombre):
        for it in self.d.find_elements(CSS, "article.cart-item"):
            if it.find_element(CSS, ".cart-item-top strong").text.strip().lower() == nombre.lower():
                return int(it.find_element(CSS, ".quantity span").text.strip())
        return 0

    def items_carrito(self):
        return len(self.d.find_elements(CSS, "article.cart-item"))

    def total_carrito(self):
        return self.d.find_element(CSS, ".cart-footer .total strong").text.strip()

    def mensaje_venta(self):
        els = self.d.find_elements(CSS, "div.message")
        return els[0].text.strip() if els else ""

    def confirmar_venta(self):
        self.d.find_element(CSS, "button.confirm").click()
        return self.visible("div.message").text.strip()

    def vender(self, items):
        """items: lista de (nombre, cantidad). Devuelve (total mostrado, mensaje)."""
        self.menu("/ventas")
        for nombre, cant in items:
            self.agregar(nombre, cant)
        # esperar a que la vista refleje todas las cantidades antes de leer el total (evita leerlo a medio pintar)
        for nombre, cant in items:
            try:
                WebDriverWait(self.d, 5).until(lambda d, n=nombre, c=cant: self.cantidad_carrito(n) == c)
            except TimeoutException:
                pass
        total = self.total_carrito()
        return total, self.confirmar_venta()

    # ---- reportes
    def reportes_hoy(self):
        self.menu("/reportes")
        self.w.until(lambda d: len(d.find_elements(CSS, ".filters input[type='date']")) == 2)
        self.d.find_element(CSS, "button.today-button").click()
        time.sleep(0.4)
        return self.leer_reporte()

    def consultar_rango(self, desde, hasta):
        campos = self.d.find_elements(CSS, ".filters input[type='date']")
        for c, v in zip(campos, (desde, hasta)):
            self.d.execute_script("arguments[0].value=arguments[1];"
                                  "arguments[0].dispatchEvent(new Event('input',{bubbles:true}));", c, v)
        self.d.find_element(CSS, "button.search-button").click()
        time.sleep(0.4)
        return self.leer_reporte()

    def leer_reporte(self):
        m = self.textos(".stats strong")
        filas = []
        if not self.d.find_elements(CSS, "section.report-card td.empty"):
            for f in self.d.find_elements(CSS, "section.report-card tbody tr:not(.detail-row)"):
                filas.append([td.text.strip() for td in f.find_elements(By.TAG_NAME, "td")])
        return {"ventas": m[0], "ingresos": m[1], "productos_vendidos": m[2], "mas_vendido": m[3], "filas": filas}

    def detalle_venta(self, folio):
        for f in self.d.find_elements(CSS, "section.report-card tbody tr:not(.detail-row)"):
            if f.find_element(By.TAG_NAME, "td").text.strip() == folio:
                f.find_element(CSS, "button.detail-button").click()
                self.visible(".detail-item")
                det = [e.text.replace("\n", " ").strip() for e in self.d.find_elements(CSS, ".detail-item")]
                f.find_element(CSS, "button.detail-button").click()  # ocultar
                time.sleep(0.2)
                return det
        return []


def clp(texto):
    """'$16.100' -> 16100"""
    d = re.sub(r"[^\d-]", "", texto or "")
    return int(d) if d else None


def fmt(n):
    return "$" + f"{n:,}".replace(",", ".")


def hoy():
    return datetime.date.today().isoformat()


# --------------------------------------------------------------------------- casos
CASOS = []


def caso(id_, ambiente, navegador="Chrome"):
    def deco(fn):
        CASOS.append((id_, ambiente, navegador, fn))
        return fn
    return deco


@caso("AUT-RU-01", "Alfa")
def ru01(r):
    s = r.sesion(ALFA)
    s.login("admin", "clave-erronea", esperar=False)
    error = s.visible("div.login-error").text.strip()
    ruta, flag = s.ruta_actual(), s.ls("coffeeflow_logged")
    r.ev(s.shot("AUT-RU-01_1_credenciales_invalidas"))
    t0 = time.perf_counter()
    s.login("admin", "1234")
    t = time.perf_counter() - t0
    r.ev(s.shot("AUT-RU-01_2_ingreso_dashboard"))
    ok = error == "Usuario o contraseña incorrectos." and ruta.startswith("/login") and flag is None and t <= 2
    r.fin("Aceptado" if ok else "Rechazado",
          f'Con clave errónea se mostró "{error}", se mantuvo en {ruta} y no se creó sesión '
          f'(coffeeflow_logged = {flag}). Con admin/1234 se abrió el Dashboard en {t:.2f} s.')


@caso("AUT-RU-02", "Alfa")
def ru02(r):
    s = r.sesion(ALFA)
    s.login()
    s.menu("/ventas")
    s.agregar("Cappuccino", 2)
    s.agregar("Croissant", 1)
    total = s.total_carrito()
    r.ev(s.shot("AUT-RU-02_1_carrito"))
    msg = s.confirmar_venta()
    items = s.items_carrito()
    r.ev(s.shot("AUT-RU-02_2_venta_confirmada"))
    s.menu("/productos")
    p = s.filas_productos()
    st_c, st_cr = p["Cappuccino"]["stock"], p["Croissant"]["stock"]
    r.ev(s.shot("AUT-RU-02_3_stock_descontado"))
    ok = (total == "$6.900" and msg == "Venta #1004 registrada correctamente." and items == 0
          and st_c == "18" and st_cr == "7")
    r.fin("Aceptado" if ok else "Rechazado",
          f'Carrito con 2 Cappuccino + 1 Croissant: total {total}. Al confirmar: "{msg}"; el carrito quedó '
          f'con {items} ítems. Stock en Productos: Cappuccino {st_c} (antes 20), Croissant {st_cr} (antes 8).')


@caso("AUT-RU-03", "Alfa")
def ru03(r):
    s = r.sesion(ALFA)
    s.login()
    s.menu("/productos")
    inicial = len(s.filas_productos())
    s.nuevo_producto(nombre="Mocha", categoria="Café", precio="0", stock="10", activo=True)
    s.guardar_modal()
    time.sleep(0.4)
    invalido_abierto = s.modal_abierto()
    r.ev(s.shot("AUT-RU-03_1_precio_0_no_guarda"))
    s.completar_producto(precio="3200")
    s.guardar_modal()
    s.esperar_modal_cerrado()
    p = s.filas_productos()
    creado = p.get("Mocha", {})
    r.ev(s.shot("AUT-RU-03_2_producto_creado"))
    s.editar_producto("Mocha")
    s.completar_producto(precio="3400")
    s.guardar_modal()
    s.esperar_modal_cerrado()
    editado = s.filas_productos().get("Mocha", {}).get("precio")
    r.ev(s.shot("AUT-RU-03_3_producto_editado"))
    aviso = s.eliminar_producto("Mocha", aceptar=True)
    time.sleep(0.3)
    final = s.filas_productos()
    r.ev(s.shot("AUT-RU-03_4_producto_eliminado"))
    ok = (invalido_abierto and creado.get("precio") == "$3.200" and creado.get("stock") == "10"
          and editado == "$3.400" and "Mocha" not in final and len(final) == inicial)
    r.fin("Aceptado" if ok else "Rechazado",
          f'Con precio 0 el formulario {"no se guardó (modal abierto)" if invalido_abierto else "se cerró"}. '
          f'Mocha creado con precio {creado.get("precio")} y stock {creado.get("stock")}; tras editar quedó en '
          f'{editado}. Al eliminar se pidió confirmación ("{aviso}") y el producto desapareció; '
          f'el catálogo volvió a {len(final)} productos (inicial {inicial}).')


@caso("AUT-RU-04", "Alfa")
def ru04(r):
    s = r.sesion(ALFA)
    s.login()
    db = s.dashboard()
    r.ev(s.shot("AUT-RU-04_1_dashboard_inicio_turno"))
    muestra_nombre = "Muffin" in db["texto"]
    cifras = (db["ventas_hoy"] == "$16.100" and db["ventas_realizadas"] == "3"
              and db["stock_bajo"] == "1" and len(db["ultimas"]) == 3)
    estado = "Aceptado" if cifras and muestra_nombre else ("Condicionado" if cifras else "Rechazado")
    r.fin(estado,
          f'Dashboard: Ventas de hoy {db["ventas_hoy"]}, Ventas realizadas {db["ventas_realizadas"]}, '
          f'Stock bajo {db["stock_bajo"]}, Productos {db["productos"]}; "Últimas ventas" con {len(db["ultimas"])} filas. '
          + ("El Dashboard identifica el producto con stock bajo (Muffin de chocolate)."
             if muestra_nombre else
             "La tarjeta solo muestra la cantidad (1): el Dashboard no indica cuál producto tiene stock bajo; "
             "hay que ir a Productos para saber que es Muffin de chocolate."))


@caso("AUT-RU-05", "Alfa")
def ru05(r):
    s = r.sesion(ALFA)
    s.login()
    s.cerrar_sesion()
    flag = s.ls("coffeeflow_logged")
    r.ev(s.shot("AUT-RU-05_1_sesion_cerrada"))
    s.d.back()
    time.sleep(1.5)
    tras_atras = s.ruta_actual()
    ve_dash_atras = bool(s.d.find_elements(CSS, ".stat-card"))
    r.ev(s.shot("AUT-RU-05_2_boton_atras"))
    s.d.get(ALFA + "/dashboard")
    time.sleep(1.5)
    tras_url = s.ruta_actual()
    ve_dash_url = bool(s.d.find_elements(CSS, ".stat-card"))
    r.ev(s.shot("AUT-RU-05_3_url_directa"))
    ok = flag is None and not ve_dash_atras and not ve_dash_url
    r.fin("Aceptado" if ok else "Rechazado",
          f'Al cerrar sesión volvió a /login y coffeeflow_logged = {flag}. Con "Atrás" quedó en {tras_atras} '
          f'({"se ve el Dashboard" if ve_dash_atras else "sin acceso"}); escribiendo /dashboard quedó en '
          f'{tras_url} ({"se ve el Dashboard" if ve_dash_url else "sin acceso"}).')


@caso("AUT-RS-01", "Alfa")
def rs01(r):
    s = r.sesion(ALFA)
    res = {}
    for ruta in ["/dashboard", "/productos", "/ventas", "/reportes"]:
        s.d.get(ALFA + ruta)
        try:
            WebDriverWait(s.d, 3).until(EC.url_contains("/login"))
        except TimeoutException:
            pass
        res[ruta] = s.ruta_actual()
        if ruta == "/productos":
            r.ev(s.shot("AUT-RS-01_1_productos_sin_sesion"))
    abiertas = [k for k, v in res.items() if not v.startswith("/login")]
    r.fin("Aceptado" if not abiertas else "Rechazado",
          "Sin iniciar sesión: " + "; ".join(f"{k} → {v}" for k, v in res.items()) + ". "
          + (f"{len(abiertas)} de 4 módulos se abrieron sin sesión." if abiertas else "Los 4 módulos redirigieron a /login."))


@caso("AUT-RS-02", "Beta (build de producción)")
def rs02(r):
    s = r.sesion(BETA)
    s.set_ls("coffeeflow_logged", "true")
    s.d.get(BETA + "/dashboard")
    time.sleep(1.5)
    ruta = s.ruta_actual()
    entra = bool(s.d.find_elements(CSS, ".stat-card"))
    r.ev(s.shot("AUT-RS-02_1_sesion_falsificada"))
    s.d.get(BETA + "/login")
    s.visible("#usuario")
    hallazgos = s.d.execute_async_script("""
        const done = arguments[arguments.length - 1];
        const urls = [...new Set([...document.scripts].map(x => x.src).filter(Boolean)
            .concat(performance.getEntriesByType('resource').map(e => e.name).filter(n => /\\.js(\\?|$)/.test(n))))];
        Promise.all(urls.map(u => fetch(u).then(x => x.text()).then(t => {
            const m = t.match(/["']admin["'][^;]{0,120}["']1234["']/);
            return m ? (u.split('/').pop() + ': ' + m[0]) : null;
        }).catch(() => null))).then(rs => done(rs.filter(Boolean)));
    """)
    ok = not entra and not hallazgos
    r.fin("Aceptado" if ok else "Rechazado",
          f'Escribiendo coffeeflow_logged="true" en localStorage (sin login) y abriendo /dashboard: quedó en {ruta} '
          f'({"se mostró el Dashboard" if entra else "acceso denegado"}). Revisión del JavaScript descargado: '
          + (f'credenciales encontradas en {"; ".join(hallazgos)}.' if hallazgos else "sin credenciales embebidas."))


@caso("AUT-RS-03", "Alfa")
def rs03(r):
    s = r.sesion(ALFA)
    s.login()
    s.menu("/ventas")
    s.agregar("Muffin de chocolate", 5)
    msg_limite = s.mensaje_venta()
    cant = s.cantidad_carrito("Muffin de chocolate")
    r.ev(s.shot("AUT-RS-03_1_quinta_unidad_rechazada"))
    msg = s.confirmar_venta()
    time.sleep(0.3)
    stock_tarjeta = s.stock_tarjeta("Muffin de chocolate")
    habilitado = s.boton_agregar_habilitado("Muffin de chocolate")
    r.ev(s.shot("AUT-RS-03_2_stock_cero_boton_deshabilitado"))
    s.menu("/productos")
    stock_lista = s.filas_productos()["Muffin de chocolate"]["stock"]
    ok = (msg_limite == "No queda más stock de Muffin de chocolate." and cant == 4
          and msg.startswith("Venta #") and stock_tarjeta == 0 and not habilitado and stock_lista == "0")
    r.fin("Aceptado" if ok else "Rechazado",
          f'Muffin de chocolate (stock 4): al pulsar agregar 5 veces el carrito quedó en {cant} y se mostró '
          f'"{msg_limite}". Se confirmó la venta ("{msg}"); el stock quedó en {stock_lista} (nunca negativo) y el '
          f'botón agregar quedó {"habilitado" if habilitado else "deshabilitado"}.')


@caso("AUT-RS-04", "Alfa")
def rs04(r):
    s = r.sesion(ALFA)
    s.set_ls("coffeeflow_productos", "{corrupto")
    s.d.refresh()
    s.login(esperar=False)
    try:
        s.esperar_dashboard(t=6)
        dash = True
    except TimeoutException:
        dash = False
    ruta = s.ruta_actual()
    errores = s.errores_consola()
    r.ev(s.shot("AUT-RS-04_1_datos_corruptos"))
    productos = None
    if dash:
        productos = s.dashboard()["productos"]
    ok = dash and productos == "8" and not errores
    r.fin("Aceptado" if ok else "Rechazado",
          f'Con coffeeflow_productos = "{{corrupto" e ingreso con admin/1234: '
          + (f"se mostró el Dashboard con {productos} productos" if dash else f"la pantalla quedó en {ruta} sin mostrar el Dashboard")
          + (f"; errores de consola: {len(errores)} (ej.: …{errores[0][-150:]})." if errores else "; sin errores de consola."))


@caso("AUT-RS-05", "Alfa")
def rs05(r):
    s = r.sesion(ALFA)
    s.d.execute_script("""
        const cats = ['Café','Té','Pastelería','Sándwich','Bebida','Otro'];
        const prods = [];
        for (let i = 1; i <= 200; i++) prods.push({id: i, nombre: 'Producto ' + i, categoria: cats[i % 6],
            precio: 1000 + (i * 37) % 4000, stock: 5 + (i * 13) % 60, activo: i % 10 !== 0});
        const ventas = [];
        const base = new Date();
        for (let v = 0; v < 500; v++) {
            const d = new Date(base.getTime() - (v % 30) * 86400000);
            const f = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
                      + 'T' + String(8 + v % 12).padStart(2,'0') + ':' + String(v % 60).padStart(2,'0') + ':00';
            const items = [];
            for (let k = 0; k < 3; k++) { const p = prods[(v * 7 + k * 11) % 200];
                items.push({productoId: p.id, nombre: p.nombre, cantidad: 1 + k, precioUnitario: p.precio, subtotal: p.precio * (1 + k)}); }
            ventas.push({id: 2000 + v, fecha: f, total: items.reduce((a, x) => a + x.subtotal, 0), items});
        }
        localStorage.setItem('coffeeflow_productos', JSON.stringify(prods));
        localStorage.setItem('coffeeflow_ventas', JSON.stringify(ventas.reverse()));
    """)
    s.d.refresh()
    tiempos = {}
    t0 = time.perf_counter()
    s.login()
    tiempos["Dashboard (tras login)"] = time.perf_counter() - t0
    for ruta, nombre, listo in [
        ("/productos", "Productos", lambda d: len(d.find_elements(CSS, "section.products-card tbody tr")) >= 200),
        ("/ventas", "Nueva venta", lambda d: len(d.find_elements(CSS, "article.product-card")) >= 150),
        ("/reportes", "Reportes", lambda d: len(d.find_elements(CSS, ".stats strong")) == 4),
        ("/dashboard", "Dashboard", lambda d: len(d.find_elements(CSS, ".stat-card strong")) == 4),
    ]:
        t0 = time.perf_counter()
        s.menu(ruta)
        WebDriverWait(s.d, 10).until(listo)
        tiempos[nombre] = time.perf_counter() - t0
        if ruta == "/productos":
            r.ev(s.shot("AUT-RS-05_1_productos_200"))
    s.menu("/reportes")
    s.w.until(lambda d: len(d.find_elements(CSS, ".filters input[type='date']")) == 2)
    for c, v in zip(s.d.find_elements(CSS, ".filters input[type='date']"), ("2000-01-01", "2099-12-31")):
        s.d.execute_script("arguments[0].value=arguments[1];"
                           "arguments[0].dispatchEvent(new Event('input',{bubbles:true}));", c, v)
    # Se mide solo hasta que la tabla muestra las 500 filas (sin leer celda por celda)
    t0 = time.perf_counter()
    s.d.find_element(CSS, "button.search-button").click()
    WebDriverWait(s.d, 30).until(lambda d: d.execute_script(
        "return document.querySelectorAll('section.report-card tbody tr:not(.detail-row)').length") >= 500)
    tiempos["Reporte rango completo (500 ventas)"] = time.perf_counter() - t0
    rep = {"ventas": s.textos(".stats strong")[0]}
    r.ev(s.shot("AUT-RS-05_2_reporte_500_ventas"))
    peor = max(tiempos, key=tiempos.get)
    ok = all(v < 2 for v in tiempos.values()) and rep["ventas"] == "500"
    r.fin("Aceptado" if ok else "Rechazado",
          "Con 200 productos y 500 ventas: " + "; ".join(f"{k} {v:.2f} s" for k, v in tiempos.items())
          + f'. El reporte listó {rep["ventas"]} ventas. Peor tiempo: {peor} ({tiempos[peor]:.2f} s).')


@caso("AUT-RS-06", "Alfa")
def rs06(r):
    s = r.sesion(ALFA)
    s.login()
    db = s.dashboard()
    horas_dash = [f[1] for f in db["ultimas"]]
    r.ev(s.shot("AUT-RS-06_1_dashboard_horas"))
    rep = s.reportes_hoy()
    r.ev(s.shot("AUT-RS-06_2_reporte_formatos"))
    fechas = [f[1] for f in rep["filas"]]
    horas = [f[2] for f in rep["filas"]]
    montos = [f[4] for f in rep["filas"]] + [rep["ingresos"], db["ventas_hoy"]]
    ok_m = all(re.fullmatch(r"\$\d{1,3}(\.\d{3})*", m) for m in montos)
    ok_f = all(re.fullmatch(r"\d{2}-\d{2}-\d{4}", f) for f in fechas)
    ok_h = all(re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", h) for h in horas + horas_dash)
    estado = "Aceptado" if ok_m and ok_f and ok_h else "Rechazado"
    r.fin(estado,
          f'Montos: {", ".join(montos[:4])} ({"CLP sin decimales" if ok_m else "formato incorrecto"}). '
          f'Fechas del reporte: {", ".join(fechas)} ({"dd-mm-aaaa" if ok_f else "formato incorrecto"}). '
          f'Horas del reporte: {", ".join(horas)}; Dashboard: {", ".join(horas_dash)} '
          f'({"24 h" if ok_h else "no cumplen HH:mm de 24 h"}).')


@caso("AUT-PN-01", "Beta (build de producción)")
def pn01(r):
    s = r.sesion(BETA)
    s.login()
    total, msg = s.vender([("Latte", 1), ("Americano", 1), ("Sándwich ave palta", 1)])
    r.ev(s.shot("AUT-PN-01_1_venta_turno"))
    s.menu("/dashboard")
    db = s.dashboard()
    r.ev(s.shot("AUT-PN-01_2_dashboard_actualizado"))
    rep = s.reportes_hoy()
    r.ev(s.shot("AUT-PN-01_3_reporte_del_dia"))
    s.cerrar_sesion()
    ok = (total == "$9.200" and msg == "Venta #1004 registrada correctamente." and db["ventas_hoy"] == "$25.300"
          and db["ventas_realizadas"] == "4" and rep["ingresos"] == "$25.300" and rep["ventas"] == "4")
    r.fin("Aceptado" if ok else "Rechazado",
          f'Venta Latte + Americano + Sándwich: total {total}, "{msg}". Dashboard: {db["ventas_hoy"]} en '
          f'{db["ventas_realizadas"]} ventas. Reporte "Hoy": {rep["ventas"]} ventas por {rep["ingresos"]}. '
          f'Turno cerrado con "Cerrar sesión".')


@caso("AUT-PN-02", "Beta (build de producción)")
def pn02(r):
    s = r.sesion(BETA)
    s.login()
    bajo_antes = s.dashboard()["stock_bajo"]
    s.menu("/productos")
    s.nuevo_producto(nombre="Brownie", categoria="Pastelería", precio="2000", stock="3", activo=True)
    s.guardar_modal()
    s.esperar_modal_cerrado()
    r.ev(s.shot("AUT-PN-02_1_brownie_creado"))
    total, msg = s.vender([("Brownie", 3)])
    hab = s.boton_agregar_habilitado("Brownie")
    r.ev(s.shot("AUT-PN-02_2_brownie_agotado"))
    s.menu("/productos")
    st = s.filas_productos()["Brownie"]["stock"]
    s.menu("/dashboard")
    bajo_despues = s.dashboard()["stock_bajo"]
    r.ev(s.shot("AUT-PN-02_3_alerta_stock_bajo"))
    ok = total == "$6.000" and msg.startswith("Venta #") and not hab and st == "0" and bajo_despues == "2"
    r.fin("Aceptado" if ok else "Rechazado",
          f'Brownie (Pastelería, $2.000, stock 3) quedó disponible en Nueva venta de inmediato. Venta de 3 unidades: '
          f'{total}, "{msg}". Stock final {st}; botón agregar {"habilitado" if hab else "deshabilitado"}. '
          f'Tarjeta Stock bajo del Dashboard: {bajo_antes} → {bajo_despues}.')


@caso("AUT-PN-03", "Beta (build de producción)")
def pn03(r):
    s = r.sesion(BETA)
    s.login()
    s.menu("/productos")
    s.editar_producto("Té verde")
    s.completar_producto(activo=False)
    s.guardar_modal()
    s.esperar_modal_cerrado()
    estado = s.filas_productos()["Té verde"]["estado"]
    r.ev(s.shot("AUT-PN-03_1_te_verde_inactivo"))
    s.menu("/ventas")
    visible_inactivo = "Té verde" in s.productos_venta()
    r.ev(s.shot("AUT-PN-03_2_venta_sin_te_verde"))
    s.menu("/productos")
    s.editar_producto("Té verde")
    s.completar_producto(activo=True)
    s.guardar_modal()
    s.esperar_modal_cerrado()
    s.menu("/ventas")
    visible_activo = "Té verde" in s.productos_venta()
    ok = estado.lower().startswith("inactiv") and not visible_inactivo and visible_activo
    r.fin("Aceptado" if ok else "Rechazado",
          f'Té verde marcado como inactivo: estado en Productos "{estado}"; en Nueva venta '
          f'{"sigue apareciendo" if visible_inactivo else "no aparece"}. Al reactivarlo '
          f'{"vuelve a estar disponible" if visible_activo else "no vuelve a aparecer"} para la venta.')


@caso("AUT-PN-04", "Beta (build de producción)")
def pn04(r):
    s = r.sesion(BETA)
    s.login()
    s.vender([("Cappuccino", 1), ("Muffin de chocolate", 1)])
    s.vender([("Espresso", 2)])
    s.menu("/dashboard")
    dash_total = s.dashboard()["ventas_hoy"]
    rep = s.reportes_hoy()
    suma_filas = sum(clp(f[4]) for f in rep["filas"])
    unidades = sum(int(f[3]) for f in rep["filas"])
    det_ok, det_txt = True, []
    for f in rep["filas"]:
        det = s.detalle_venta(f[0])
        suma_det = sum(clp(x.split(" ")[-1]) for x in det)
        det_txt.append(f"{f[0]} {f[4]} = {fmt(suma_det)}")
        det_ok &= suma_det == clp(f[4])
    r.ev(s.shot("AUT-PN-04_1_cuadratura_reporte"))
    dif = clp(rep["ingresos"]) - suma_filas
    ok = (dif == 0 and clp(dash_total) == clp(rep["ingresos"]) == 24700 and str(unidades) == rep["productos_vendidos"]
          and det_ok and rep["mas_vendido"] == "Cappuccino")
    r.fin("Aceptado" if ok else "Rechazado",
          f'Tras 2 ventas del turno ($4.800 y $3.800): reporte "Hoy" con {rep["ventas"]} ventas, ingresos '
          f'{rep["ingresos"]}; suma de las filas {fmt(suma_filas)} (diferencia {fmt(dif)}); Dashboard {dash_total}. '
          f'Productos vendidos {rep["productos_vendidos"]} (suma de filas {unidades}); más vendido {rep["mas_vendido"]}. '
          f'Detalle de cada venta = total: {"sí" if det_ok else "no"} ({"; ".join(det_txt)}).')


@caso("AUT-PN-05", "Beta (build de producción)", "Chrome y Edge")
def pn05(r):
    perfil = tempfile.mkdtemp(prefix="aut_perfil_")
    try:
        s = r.sesion(BETA, perfil=perfil)
        s.login()
        _, msg = s.vender([("Croissant", 1)])
        s.cerrar()
        s2 = r.sesion(BETA, perfil=perfil, limpiar=False)
        s2.d.get(BETA + "/dashboard")
        time.sleep(1.5)
        if not s2.d.find_elements(CSS, ".stat-card"):
            s2.d.get(BETA + "/login")
            s2.login()
        rep = s2.reportes_hoy()
        folios = [f[0] for f in rep["filas"]]
        s2.menu("/productos")
        st = s2.filas_productos()["Croissant"]["stock"]
        r.ev(s2.shot("AUT-PN-05_1_chrome_tras_reabrir"))
        err_chrome = s2.errores_consola()
        s2.cerrar()
    finally:
        shutil.rmtree(perfil, ignore_errors=True)
    e = r.sesion(BETA, navegador="edge")
    e.login()
    tot_e, msg_e = e.vender([("Americano", 2)])
    rep_e = e.reportes_hoy()
    r.ev(e.shot("AUT-PN-05_2_edge_flujo_completo"))
    err_edge = e.errores_consola()
    persiste = "#1004" in folios and st == "7"
    edge_ok = msg_e == "Venta #1004 registrada correctamente." and rep_e["ventas"] == "4"
    ok = persiste and edge_ok and not err_chrome and not err_edge
    r.fin("Condicionado" if ok else "Rechazado",
          f'Chrome: venta de 1 Croissant ("{msg}"); tras cerrar y reabrir el navegador el reporte del día incluye '
          f'{"#1004" if "#1004" in folios else "solo " + ", ".join(folios)} y el stock de Croissant es {st}. '
          f'Edge: venta de 2 Americano ({tot_e}, "{msg_e}") y reporte con {rep_e["ventas"]} ventas. '
          f'Errores de consola: Chrome {len(err_chrome)}, Edge {len(err_edge)}. Firefox no está instalado en el '
          f'equipo de pruebas: la compatibilidad con Firefox (RNF-03) queda pendiente.')


# --------------------------------------------------------------------------- usabilidad (Parcial 3)
# Casos derivados del cuestionario UAT de 18 preguntas (plantilla de informe del Parcial 3).
JS_SIN_NOMBRE = r"""
return [...document.querySelectorAll('button,a,input,select')].filter(b => {
    if (b.offsetParent === null) return false;
    const txt = (b.innerText || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').trim();
    const lbl = b.getAttribute('aria-label') || b.getAttribute('title') || b.getAttribute('placeholder');
    const etiquetado = b.labels && b.labels.length > 0;   // etiqueta asociada con for/id o que envuelve al campo
    return !(txt.length > 1 || lbl || etiquetado);
}).map(b => b.tagName.toLowerCase() + '.' + b.className);
"""


@caso("AUT-UX-01", "Alfa")
def ux01(r):
    s = r.sesion(ALFA)
    # login con los dos campos vacíos
    s.escribir(s.visible("#usuario"), "")
    s.escribir(s.d.find_element(CSS, "#password"), "")
    s.d.find_element(CSS, "button.login-button").click()
    time.sleep(0.4)
    login = s.textos(".field-error")
    r.ev(s.shot("AUT-UX-01_1_login_campos_vacios"))
    # formulario de producto con nombre en blanco, precio 0 y stock negativo
    s.login("admin", "1234")
    s.menu("/productos")
    antes = len(s.filas_productos())
    s.nuevo_producto(nombre="     ", precio="0", stock="-1")
    s.guardar_modal()
    time.sleep(0.4)
    invalido = s.textos("section.modal .field-error")
    abierto = s.modal_abierto()
    r.ev(s.shot("AUT-UX-01_2_producto_invalido"))
    # decimales: CLP y unidades son enteros
    s.completar_producto(nombre="Moka", precio="1500.5", stock="2.5")
    s.guardar_modal()
    time.sleep(0.4)
    decimales = s.textos("section.modal .field-error")
    r.ev(s.shot("AUT-UX-01_3_decimales"))
    guardo_decimales = not s.modal_abierto()
    if not guardo_decimales:
        s.d.find_element(CSS, "section.modal .secondary-button").click()
    despues = len(s.filas_productos())
    esperado_login = ["Ingresa tu usuario.", "Ingresa tu contraseña."]
    esperado_prod = ["El nombre es obligatorio.", "El precio debe ser un número entero mayor o igual a 1.",
                     "El stock debe ser un número entero mayor o igual a 0."]
    ok = (login == esperado_login and invalido == esperado_prod and abierto and despues == antes
          and decimales == esperado_prod[1:])
    r.fin("Aceptado" if ok else "Rechazado",
          f"Login vacío: {login or 'sin mensajes'}. Producto con nombre en blanco, precio 0 y stock −1: "
          f"{len(invalido)} mensaje(s) ({'modal abierto' if abierto else 'modal cerrado'}). Con decimales: "
          f"{len(decimales)} mensaje(s)" + (" (el producto con decimales SE GUARDÓ)" if guardo_decimales else "")
          + f". Productos antes/después: {antes}/{despues}.")


@caso("AUT-UX-02", "Alfa")
def ux02(r):
    s = r.sesion(ALFA)
    s.login("admin", "1234")
    s.menu("/productos")
    s.filas_productos()
    sin = {"Productos": s.d.execute_script(JS_SIN_NOMBRE)}
    s.d.find_element(CSS, ".page-header .primary-button").click()
    s.visible("section.modal")
    sin["Modal de producto"] = s.d.execute_script(JS_SIN_NOMBRE)
    r.ev(s.shot("AUT-UX-02_1_modal_producto"))
    s.d.find_element(CSS, "section.modal .secondary-button").click()
    s.menu("/ventas")
    s.agregar("Cappuccino")
    sin["Nueva venta"] = s.d.execute_script(JS_SIN_NOMBRE)
    r.ev(s.shot("AUT-UX-02_2_nueva_venta_con_pedido"))
    total = sum(len(v) for v in sin.values())
    detalle = "; ".join(f"{k}: {len(v)}" for k, v in sin.items())
    r.fin("Aceptado" if total == 0 else "Rechazado",
          f"Controles visibles sin nombre accesible (texto, aria-label o title): {total} ({detalle}).")


@caso("AUT-UX-03", "Alfa")
def ux03(r):
    s = r.sesion(ALFA)
    s.login("admin", "1234")
    s.menu("/reportes")
    s.w.until(lambda d: len(d.find_elements(CSS, ".filters input[type='date']")) == 2)
    s.consultar_rango("2026-12-31", "2026-01-01")
    aviso = s.textos(".range-error")
    r.ev(s.shot("AUT-UX-03_1_rango_invertido"))
    s.consultar_rango("2026-01-01", "2026-12-31")
    sin_aviso = not s.d.find_elements(CSS, ".range-error")
    ok = bool(aviso) and "«Desde» no puede ser posterior a «Hasta»" in aviso[0] and sin_aviso
    r.fin("Aceptado" if ok else "Rechazado",
          (f'Con Desde 31-12-2026 y Hasta 01-01-2026 se mostró: "{aviso[0]}"' if aviso
           else "Con Desde posterior a Hasta solo se mostró «No existen ventas para las fechas seleccionadas.»")
          + f'. Con un rango válido el aviso {"desaparece" if sin_aviso else "no desaparece"}.')


@caso("AUT-UX-04", "Alfa")
def ux04(r):
    s = r.sesion(ALFA)
    s.login("admin", "1234")
    res = {}
    for ruta, nombre in (("/productos", "Productos"), ("/ventas", "Nueva venta")):
        s.menu(ruta)
        ayuda = s.d.find_elements(CSS, "details.help")
        if ayuda:
            s.d.find_element(CSS, "details.help summary").click()
            time.sleep(0.3)
            res[nombre] = (ayuda[0].find_element(CSS, "summary").text.strip(),
                           len([li for li in ayuda[0].find_elements(CSS, "ol li") if li.is_displayed()]))
            r.ev(s.shot(f"AUT-UX-04_{nombre.replace(' ', '_')}_ayuda"))
        else:
            res[nombre] = None
    ok = all(v and v[1] == 3 for v in res.values())
    r.fin("Aceptado" if ok else "Rechazado",
          "; ".join(f'{k}: ' + (f'«{v[0]}» con {v[1]} pasos visibles' if v else "sin ayuda para el usuario nuevo")
                    for k, v in res.items()) + ".")


@caso("AUT-UX-05", "Alfa")
def ux05(r):
    s = r.sesion(ALFA)
    s.login("admin", "1234")
    el = s.visible(".topbar .welcome")
    texto = el.text.strip()
    r.ev(s.shot("AUT-UX-05_1_fecha_barra_superior"))
    # Selenium no aplica ::first-letter al texto: se verifica el texto del DOM (sin mayúsculas intermedias)
    # y que la regla de estilo ponga en mayúscula solo la primera letra.
    primera = s.d.execute_script("return getComputedStyle(arguments[0], '::first-letter').textTransform;", el)
    completa = s.d.execute_script("return getComputedStyle(arguments[0]).textTransform;", el)
    ok = (bool(re.fullmatch(r"[a-záéíóú]+, \d{1,2} de [a-záéíóú]+", texto))
          and primera == "uppercase" and completa == "none")
    r.fin("Aceptado" if ok else "Rechazado",
          f'La barra superior muestra «{texto[:1].upper() + texto[1:]}» (texto del DOM: «{texto}»; primera letra en '
          f'mayúscula por CSS: {primera}; transformación del texto completo: {completa}). Formato esperado: '
          f'«Miércoles, 25 de noviembre».')


# --------------------------------------------------------------------------- ejecución
class Registro:
    def __init__(self, id_, ambiente, navegador):
        self.id, self.ambiente, self.navegador = id_, ambiente, navegador
        self.evidencias, self.sesiones = [], []
        self.estado, self.obtenido = None, ""

    def sesion(self, *a, **k):
        s = Sesion(*a, **k)
        self.sesiones.append(s)
        return s

    def ev(self, archivo):
        self.evidencias.append(archivo)

    def fin(self, estado, obtenido):
        self.estado, self.obtenido = estado, obtenido


def main():
    solo = {x.strip() for x in ARGS.solo.split(",") if x.strip()}
    resultados = []
    inicio = datetime.datetime.now()
    for id_, amb, nav, fn in CASOS:
        if solo and id_ not in solo:
            continue
        r = Registro(id_, amb, nav)
        t0 = time.perf_counter()
        try:
            fn(r)
        except Exception as ex:
            r.estado = "Error de ejecución"
            r.obtenido = f"{type(ex).__name__}: {str(ex).splitlines()[0] if str(ex) else ''}"
            r.traza = traceback.format_exc()
            for s in r.sesiones:
                try:
                    r.ev(s.shot(f"{id_}_error"))
                except Exception:
                    pass
        finally:
            for s in r.sesiones:
                s.cerrar()
        dur = time.perf_counter() - t0
        resultados.append({"id": id_, "ambiente": amb, "navegador": nav, "estado": r.estado,
                           "obtenido": r.obtenido, "evidencias": r.evidencias, "duracion_s": round(dur, 1),
                           "fecha": datetime.datetime.now().strftime("%d-%m-%Y %H:%M"),
                           "traza": getattr(r, "traza", "")})
        print(f"{id_:10} {r.estado:20} {dur:5.1f}s  {r.obtenido[:150]}", flush=True)
    previo = {}
    archivo = OUT / "resultados.json"
    if solo and archivo.exists():
        previo = {x["id"]: x for x in json.loads(archivo.read_text(encoding="utf-8"))["resultados"]}
    for x in resultados:
        previo[x["id"]] = x
    orden = [c[0] for c in CASOS]
    final = sorted(previo.values(), key=lambda x: orden.index(x["id"]))
    archivo.write_text(json.dumps({"ciclo": ARGS.ciclo, "alfa": ALFA, "beta": BETA,
                                   "inicio": inicio.strftime("%d-%m-%Y %H:%M:%S"),
                                   "fin": datetime.datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
                                   "resultados": final}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nResultados en {archivo}")


if __name__ == "__main__":
    main()
