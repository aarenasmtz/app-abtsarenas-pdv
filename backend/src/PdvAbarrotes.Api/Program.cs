using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PdvAbarrotes.Api.Middlewares;
using PdvAbarrotes.Infraestructura;
using PdvAbarrotes.Infraestructura.Persistencia;

var builder = WebApplication.CreateBuilder(args);

// 1. Inyección de dependencias de capas
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpContextAccessor();

// 2. Configuración de Autenticación JWT Bearer
var claveSecreta = builder.Configuration["Jwt:ClaveSecreta"] 
    ?? "PdvAbarrotesArenas_SuperClaveSecretaSegura2026_JWT_Token_Key_987654321";
var emisor = builder.Configuration["Jwt:Emisor"] ?? "PdvAbarrotesApi";
var audiencia = builder.Configuration["Jwt:Audiencia"] ?? "PdvAbarrotesWeb";

builder.Services.AddAuthentication(opciones =>
{
    opciones.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    opciones.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(opciones =>
{
    opciones.RequireHttpsMetadata = false;
    opciones.SaveToken = true;
    opciones.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(claveSecreta)),
        ValidateIssuer = true,
        ValidIssuer = emisor,
        ValidateAudience = true,
        ValidAudience = audiencia,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 3. Configuración de Swagger en español
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "PDV Abarrotes Arenas API",
        Version = "v1",
        Description = "API REST de alto rendimiento para el sistema de punto de venta Abarrotes Arenas (.NET 9)."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Autenticación JWT usando el encabezado Bearer. Ejemplo: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 4. Capa de Infraestructura (EF Core 9, SQL Server, Dapper, Servicios)
builder.Services.AgregarInfraestructura(builder.Configuration);

// 5. Compresión HTTP de respuestas (Gzip y Brotli para acelerar payloads JSON)
builder.Services.AddResponseCompression(opciones =>
{
    opciones.EnableForHttps = true;
});

// 6. Política CORS para el frontend React Vite y Cloudflare Workers
builder.Services.AddCors(opciones =>
{
    opciones.AddPolicy("PoliticaPdvWeb", politica =>
    {
        politica.SetIsOriginAllowed(origen =>
        {
            if (string.IsNullOrEmpty(origen)) return false;
            try
            {
                var uri = new Uri(origen);
                return uri.Host == "localhost"
                    || uri.Host == "127.0.0.1"
                    || uri.Host == "179.236.248.165"
                    || uri.Host.EndsWith("abarrotesarenas.com", StringComparison.OrdinalIgnoreCase)
                    || uri.Host.EndsWith("workers.dev", StringComparison.OrdinalIgnoreCase)
                    || uri.Host.EndsWith("pages.dev", StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

var app = builder.Build();

app.UseResponseCompression();

// 6. Inicialización automática de datos base (Roles y credenciales iniciales)
using (var alcance = app.Services.CreateScope())
{
    try
    {
        var contexto = alcance.ServiceProvider.GetRequiredService<ContextoPrincipal>();
        await InicializadorDatos.InicializarAsync(contexto);
    }
    catch (Exception ex)
    {
        var logger = alcance.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error durante la inicialización de datos base.");
    }
}

// 7. Middleware de excepciones global
app.UseMiddleware<ManejadorExcepcionesMiddleware>();

// 8. Pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "PDV Abarrotes API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("PoliticaPdvWeb");

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
