using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PdvAbarrotes.Aplicacion.Interfaces;
using PdvAbarrotes.Infraestructura.Persistencia;
using PdvAbarrotes.Infraestructura.Servicios;

namespace PdvAbarrotes.Infraestructura;

/// <summary>
/// Métodos de extensión para registrar la capa de infraestructura en el contenedor de dependencias.
/// </summary>
public static class ConfiguracionInfraestructura
{
    public static IServiceCollection AgregarInfraestructura(this IServiceCollection servicios, IConfiguration configuracion)
    {
        var cadenaConexion = configuracion.GetConnectionString("CadenaConexion") 
            ?? "Server=AAM;Database=PdvAbarrotesArenas;Trusted_Connection=True;TrustServerCertificate=True;";

        servicios.AddDbContext<ContextoPrincipal>(opciones =>
            opciones.UseSqlServer(cadenaConexion, sqlOpciones =>
            {
                sqlOpciones.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorNumbersToAdd: null);
            }));

        servicios.AddScoped<IContextoPrincipal>(proveedor => 
            proveedor.GetRequiredService<ContextoPrincipal>());

        servicios.AddScoped<IServicioUsuarioActual, ServicioUsuarioActual>();
        servicios.AddScoped<IServicioAuditoria, ServicioAuditoria>();
        servicios.AddScoped<IServicioGeneradorJwt, ServicioGeneradorJwt>();
        servicios.AddScoped<IServicioAutenticacion, ServicioAutenticacion>();
        servicios.AddScoped<IServicioUsuarios, ServicioUsuarios>();
        servicios.AddScoped<IServicioCatalogos, ServicioCatalogos>();
        servicios.AddScoped<IServicioProductos, ServicioProductos>();
        servicios.AddScoped<IServicioInventario, ServicioInventario>();
        servicios.AddScoped<IServicioVentas, ServicioVentas>();
        servicios.AddScoped<IServicioTicketsPendientes, ServicioTicketsPendientes>();
        servicios.AddScoped<IServicioCaja, ServicioCaja>();
        servicios.AddScoped<IProveedorRecargas, ProveedorRecargasPendiente>();
        servicios.AddScoped<IProveedorServicios, ProveedorServiciosPendiente>();
        servicios.AddScoped<IServicioProveedores, ServicioProveedores>();
        servicios.AddScoped<IServicioCompras, ServicioCompras>();
        servicios.AddScoped<IServicioReportes, ServicioReportes>();
        servicios.AddScoped<IServicioPedidosSugeridos, ServicioPedidosSugeridos>();
        servicios.AddScoped<IServicioRecargasYServicios, ServicioRecargasYServicios>();

        // Caché en memoria para catálogos estáticos y alta concurrencia
        servicios.AddMemoryCache();

        return servicios;
    }
}
