namespace DiplomTask.Models
{
    public class Patient
    {
        public string Name { get; set; }
        public string SurName { get; set; }
        public string MiddleName { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        public string MedicHelp { get; set; } = "Вакцинация";
        public string Gmail { get; set; }
        public Date DateOfBirth { get; set; }
    }
}
