export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Si es una petición hacia la API, proxificarla hacia el VPS en abarrotesarenas.com
    if (url.pathname.startsWith('/api/')) {
      const targetUrl = new URL(url.pathname + url.search, 'https://abarrotesarenas.com');

      // Preflight OPTIONS para CORS
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

      // Reenviar solicitud al backend de producción
      const proxyHeaders = new Headers(request.headers);
      proxyHeaders.set('Host', 'abarrotesarenas.com');

      const proxyRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: proxyHeaders,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
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
        return new Response(JSON.stringify({ exito: false, mensaje: 'Error al conectar con el backend VPS' }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // Servir archivos estáticos del frontend Vite
    return env.ASSETS.fetch(request);
  },
};
