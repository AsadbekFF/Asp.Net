using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebApplication5.Models
{
    public class Type
    {
        public int PercentageOfFruits { get; set; }
        public int PercentageOfVegetables { get; set; }
        public int PercentageOfOthers { get; set; }

        public int PercentageOfEmptiness { get { return 100 - PercentageOfFruits - PercentageOfVegetables - PercentageOfOthers; } }
    }
}
