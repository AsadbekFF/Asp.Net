using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebApplication5.Models
{
    public class Product
    {
        public int ID { get; set; }
        public string NameOfClient { get; set; }
        public string NameOfProduct { get; set; }
        public string Type { get; set; }
        public string PhoneNumber { get; set; }
        public int Capacity { get; set; }
        public DateTime DateOfArrival { get; set; }
        public DateTime? DateOfLeaving { get; set; }
    }
}
