using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebApplication5.Models
{
    public class ReportProducts
    {
        public int? ID { get; set; }
        public string NameOfProduct { get; set; }
        public string Type { get; set; }
        public int? IncomeCapacity { get; set; }
        public int? OutCapacity { get; set; }
        public DateTime? MyProperty { get; set; }
        public DateTime? MyProperty2 { get; set; }
    }
}
