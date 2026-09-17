namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Cliente comercial. Mapea a dbo.Clientes. IdCliente=1 es 'Público en General' / Mostrador.
/// </summary>
public class Cliente
{
    public int IdCliente { get; set; }
    public int? NumeroCliente { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public string Colonia { get; set; } = string.Empty;
    public string CodigoPostal { get; set; } = string.Empty;
    public string? Rfc { get; set; }
    public bool TieneCredito { get; set; }
    public decimal LimiteCredito { get; set; }
    public decimal SaldoActual { get; set; }
    public int DiasCredito { get; set; }
    public bool EsSistema { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaRegistro { get; set; }

    public string NombreCompleto => $"{Nombre} {Apellidos}".Trim();
}
