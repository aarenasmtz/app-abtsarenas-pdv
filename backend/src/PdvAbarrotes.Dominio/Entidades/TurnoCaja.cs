namespace PdvAbarrotes.Dominio.Entidades;

/// <summary>
/// Turno o sesión de trabajo de un cajero. Mapea a dbo.TurnosCaja.
/// </summary>
public class TurnoCaja
{
    public int IdTurnoCaja { get; set; }
    public int IdCaja { get; set; }
    public int IdUsuario { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime? FechaCierre { get; set; }
    public string Estatus { get; set; } = "Abierto"; // Abierto / Cerrado

    public virtual Caja? Caja { get; set; }
    public virtual Usuario? Usuario { get; set; }
}
