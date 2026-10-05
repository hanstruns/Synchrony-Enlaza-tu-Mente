# Synchrony · Actualización web de música y efectos

Este paquete se aplica sobre tu web de Synchrony para GitHub Pages. Incluye las mejoras de audio de la app Flutter adaptadas al navegador.

## Lo que incorpora

- Las mismas piezas originales sin voces: «Umbral sereno» en Crear/Unirme/Online y sala de espera; «Mente en calma» desde la cuenta atrás, durante las rondas y hasta el resultado.
- Reproducción en bucle, transición suave entre pistas y volumen independiente (22 % inicialmente; máximo 50 %).
- Los ocho efectos originales de la aplicación: carta, cuenta atrás, inicio, éxito, fallo, victoria, derrota y prueba.
- Ajustes accesibles desde el botón ⚙: música, efectos, vibración, volumen y botones de prueba. Las preferencias quedan guardadas en ese navegador.
- Silencio al ocultar la pestaña o durante una pausa publicitaria.
- En Unirme se puede pegar un código o un enlace de invitación.
- Integración opcional para publicidad web H5 tras una victoria/derrota completa, al volver al inicio. Sin anuncios por ronda ni por perder una vida.

## Subir a GitHub Pages

1. Guarda una copia de tu web actual.
2. Copia el CONTENIDO de este ZIP sobre la raíz del repositorio web, junto al `index.html` actual. Reemplaza los archivos coincidentes y sube completa la carpeta `assets/`.
3. Conserva tu `config.js`, con la dirección de Render: no viene en este parche para evitar sustituirla. Conserva también los demás archivos de tu proyecto, como `game.js`, `package.json`, el icono y el manifiesto.
4. Confirma los cambios y espera a que termine el despliegue de GitHub Pages.
5. Recarga con Ctrl+F5 en el ordenador. Si el móvil conserva la versión anterior, cierra y vuelve a abrir la pestaña o borra la caché del sitio.
6. Pulsa cualquier botón de la web: el navegador exige una primera interacción para permitir el audio. Abre ⚙ y comprueba Música de fondo, Probar sonido y Probar vibración. Los efectos conservan la preferencia anterior y pueden estar apagados.

No necesitas comandos de Flutter ni generar una APK. La web sigue usando el servidor de Render que ya tienes y puede compartir salas con la app.

Si Render solo aloja la API mientras juegas desde GitHub Pages, no necesitas redesplegar Render para estas mejoras. Si también abres la página directamente en la URL de Render, sube allí los archivos del parche, incluidos `server.js` y `assets/`, y redespliega: el servidor actualizado permite servir los nuevos recursos públicos. No cambia las reglas ni el contrato de la API.

Para comprobarlo localmente sobre tu proyecto Node completo:

```bash
npm test
node server.js
```

Después abre `http://localhost:3000`. No abras `index.html` haciendo doble clic: la carga de los archivos de audio necesita HTTP/HTTPS.

## Límites del navegador

La música empieza después de una pulsación o interacción con teclado; no puede garantizarse el inicio automático al abrir la página. Revisa el volumen multimedia y, en iPhone, el modo silencio. La música puede tardar un poco en la primera carga: los dos WAV suman unos 12 MB y luego se reutilizan durante la sesión.

La vibración usa la API del navegador. Funciona solo donde el navegador y el dispositivo lo admiten; Safari de iPhone no ofrece esta API. No se puede hacer funcionar ahí mediante el permiso de Android o el código Flutter. El botón de prueba avisa si la función no está disponible o está bloqueada. Incluso si la API está presente, la prueba física depende del hardware y los ajustes del sistema.

## Publicidad web

Los anuncios AdMob de Android/iOS no se trasladan directamente a GitHub Pages. Esta entrega prepara la API de Google AdSense H5 Games y deja la publicidad DESACTIVADA porque no se ha proporcionado una cuenta web aprobada.

`web-ads-config.js` contiene:

```js
window.SYNCHRONY_WEB_ADS = {
  enabled: false,
  publisher: '',
  testMode: true
};
```

Para activarla posteriormente:

1. Solicita acceso/configura una cuenta compatible con AdSense H5 Games y el sitio donde publicarás el juego. La aprobación corresponde a Google.
2. Completa la política de privacidad del sitio, el consentimiento web/CMP exigido para tus visitantes y la verificación del sitio/archivo `ads.txt` según las instrucciones de tu cuenta. El consentimiento UMP de Flutter no cubre a los visitantes de esta web. Instala la configuración de consentimiento indicada por Google en la página antes de habilitar publicidad real.
3. Introduce el identificador web `ca-pub-XXXXXXXXXXXXXXXX` en `publisher`; no el `ca-app-pub-...` de AdMob.
4. Cambia `enabled` a `true`, manteniendo `testMode: true`, y prueba la integración con tu cuenta compatible. En Ajustes verás si se ha preparado o si falla la carga.
5. Tras validar cuenta, sitio, consentimiento e integración, cambia `testMode` a `false` para solicitar publicidad real.

El juego ofrece una oportunidad al finalizar una partida y volver al inicio. Si el proveedor no está preparado, no se pide el anuncio; si está preparado pero no hay inventario, su callback permite continuar. Antes de mostrarlo se cierra la sesión del juego y se silencia el audio. No se fuerzan tiempos mínimos ni máximos ni se ocultan controles del proveedor. No se ha probado una impresión real: no hay credenciales web configuradas.

Documentación: https://developers.google.com/ad-placement/docs/example ; https://developers.google.com/ad-placement/apis/adbreak ; https://support.google.com/adsense/answer/9959170

## Validación

Han pasado las 22 pruebas: las del servidor y las nuevas pruebas automatizadas de música, efectos y flujo publicitario con APIs simuladas. Se comprueba por HTTP que los recursos de audio se sirven correctamente y que no se exponen archivos privados. Las verificaciones de JavaScript no sustituyen probar el altavoz, la vibración y la publicidad real en cada dispositivo. No se ha completado una revisión visual con navegador automatizado en este entorno: no se pudo descargar su ejecutable.
