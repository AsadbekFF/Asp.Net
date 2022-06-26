using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using WebApplication5.Models;

namespace WebApplication5.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public async Task<IActionResult> Index()
        {
            await ShouldBeDone();

            return View();
        }

        public async Task<List<Product>> GetRecords()
        {
            List<Product> products = new List<Product>();
            SqlConnection conn = new(@"Server=(localdb)\MSSQLLocalDB;Database=Products;Trusted_Connection=True;");
            //SqlConnection conn = new(@"Data Source=(localdb)\MSSQLLocalDB;Initial Catalog=Hospital;Integrated Security=True;Connect Timeout=30;Encrypt=False;TrustServerCertificate=False;ApplicationIntent=ReadWrite;MultiSubnetFailover=False");
            conn.Open();

            SqlCommand sqlCommandGetData = new("Select * from ProductsTable", conn);

            using (SqlDataReader reader = sqlCommandGetData.ExecuteReader())
            {
                while (await reader.ReadAsync())
                {
                    Product product = new();
                    product.ID = (int)reader["ID"];
                    product.NameOfClient = reader["NameOfClient"].ToString();
                    product.NameOfProduct = reader["NameOfProduct"].ToString();
                    product.Type = reader["Type"].ToString();
                    product.PhoneNumber = reader["PhoneNumber"].ToString();
                    product.Capacity = (int)reader["Capacity"];
                    product.DateOfArrival = (DateTime)reader["DateOfArrival"];
                    //if (reader["DateOfDeparture"].ToString().ToUpper() == "NULL")
                    //{
                    //    product.DateOfLeaving = null;
                    //}
                    //else
                    //{
                    //    product.DateOfLeaving = (DateTime?)reader["DateOfDeparture"];
                    //}
                    try
                    {
                        product.DateOfLeaving = (DateTime?)reader["DateOfDeparture"];
                    }
                    catch
                    {
                        product.DateOfLeaving = null;
                    }

                    products.Add(product);
                }
            }

            return products;
        }

        public async Task<IActionResult> ChangeRecord(Product product)
        {
            var records = await GetRecords();
            SqlConnection conn = new(@"Server=(localdb)\MSSQLLocalDB;Database=Products;Trusted_Connection=True;");
            conn.Open();
            if (records.Any(x => x.NameOfProduct == product.NameOfProduct && x.NameOfClient == product.NameOfClient))
            {
                SqlCommand sqlCommand = new("Update ProductsTable " +
                $"Set Capacity=Capacity-{product.Capacity} " +
                $"Where NameOfClient=N'{product.NameOfClient}' And NameOfProduct=N'{product.NameOfProduct}'", conn);

                sqlCommand.ExecuteNonQuery();
            }
            else
            {
                await ShouldBeDone();
                return View("Index");
            }

            await ShouldBeDone();

            return View("Index");
        }

        public async Task<IActionResult> AddRecord(Product product)
        {
            var records = await GetRecords();
            SqlConnection conn = new(@"Server=(localdb)\MSSQLLocalDB;Database=Products;Trusted_Connection=True;");
            conn.Open();
            if (records.Any(x => x.NameOfProduct == product.NameOfProduct && x.NameOfClient == product.NameOfClient))
            {
                SqlCommand sqlCommand = new("Update ProductsTable " +
                $"Set Capacity=Capacity+{product.Capacity} " +
                $"Where NameOfClient=N'{product.NameOfClient}' And NameOfProduct=N'{product.NameOfProduct}'", conn);

                sqlCommand.ExecuteNonQuery();
            }
            else
            {
                SqlCommand cmd = new($"INSERT INTO ProductsTable (NameOfClient, NameOfProduct, Type, PhoneNumber, Capacity, DateOfDeparture, DateOfArrival) VALUES (N'{product.NameOfClient}', N'{product.NameOfProduct}', N'{product.Type}', N'{product.PhoneNumber}', N'{product.Capacity}', NULL, GETDATE())", conn);

                cmd.ExecuteNonQuery();
            }
            //SqlConnection conn = new(@"Data Source=(localdb)\MSSQLLocalDB;Initial Catalog=Hospital;Integrated Security=True;Connect Timeout=30;Encrypt=False;TrustServerCertificate=False;ApplicationIntent=ReadWrite;MultiSubnetFailover=False");
            //CheckingFormatOfVisitorInput(visitors);

            await ShouldBeDone();

            return View("Index");
        }

        private async Task ShouldBeDone()
        {
            var products = await GetRecords();

            ViewData["Products"] = products;

            var item = from x in products
                       group x by x.Type into Group
                       select new
                       {
                           Type = Group.Key,
                           Capacity = Group.Sum(x => x.Capacity)
                       };

            Models.Type type = new()
            {
                PercentageOfFruits = item.Where(x => x.Type == "Овощи").Sum(x => x.Capacity) / 2500,
                PercentageOfVegetables = item.Where(x => x.Type == "Фрукты").Sum(x => x.Capacity) / 2500,
                PercentageOfOthers = item.Where(x => x.Type == "Другое").Sum(x => x.Capacity) / 2500
            };

            ViewData["Types"] = type;
        }

        //public async Task<dynamic> Assignment(List<Product> products)
        //{
        //    Models.Type type = new();

        //    return item;
        //}

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
