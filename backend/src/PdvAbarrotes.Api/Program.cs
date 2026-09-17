using Microsoft.OpenApi.Models;
using PdvAbarrotes.Api.Middlewares;
using PdvAbarrotes.Infraestructura;

var builder = WebApplication.CreateBuilder(args);

// 1. Inyección de dependencias de capas
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpContextAccessor();

// 2. Configuración de Swagger en español
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

// 3. Capa de Infraestructura (EF Core 9, SQL Server, Dapper, Servicios)
builder.Services.AgregarInfraestructura(builder.Configuration);

// 4. Política CORS para el frontend React Vite
builder.Services.AddCors(opciones =>
{
    opciones.AddPolicy("PoliticaPdvWeb", politica =>
    {
        politica.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
    });
});

var app = builder.Build();

// 5. Middleware de excepciones global
app.UseMiddleware<ManejadorExcepcionesMiddleware>();

// 6. Pipeline HTTP
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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
