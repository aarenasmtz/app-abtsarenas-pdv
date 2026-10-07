export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Si la petición es hacia la API, actuar como proxy inverso hacia el VPS de producción
    if (url.pathname.startsWith('/api/')) {
      const targetUrl = new URL(url.pathname + url.search, 'https://abarrotesarenas.com');

      // Responder preflight OPTIONS para CORS
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      // Preparar cabeceras para el backend
      const proxyHeaders = new Headers(request.headers);
      proxyHeaders.set('Host', 'abarrotesarenas.com');

      // Leer el cuerpo si no es GET ni HEAD
      let bodyData = undefined;
      if (!['GET', 'HEAD'].includes(request.method)) {
        try {
          bodyData = await request.clone().arrayBuffer();
        } catch {
          bodyData = undefined;
        }
      }

      const proxyRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: proxyHeaders,
        body: bodyData,
        redirect: 'follow',
      });

      try {
        const respuesta = await fetch(proxyRequest);
        const responseHeaders = new Headers(respuesta.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');

        return new Response(respuesta.body, {
          status: respuesta.status,
          statusText: respuesta.statusText,
          headers: responseHeaders,
        });
      } catch (err) {
        return new Response(
          JSON.stringify({
            exito: false,
            mensaje: 'Error de conexión con el backend en abarrotesarenas.com',
            detalle: err instanceof Error ? err.message : String(err),
          }),
          {
            status: 502,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // Para cualquier otra ruta, servir la aplicación frontend SPA
    return env.ASSETS.fetch(request);
  },
};
