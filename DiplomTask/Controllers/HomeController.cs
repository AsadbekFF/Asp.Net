using DiplomTask.Models;
using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using Microsoft.AspNetCore.SignalR;
using System.Text;
using Infobip.Api.Client;
using Infobip.Api.Client.Api;
using Infobip.Api.Client.Model;

namespace DiplomTask.Controllers
{
    public class HomeController : Controller
    {
        private readonly IHubContext<Hub> hubContext;
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        public IActionResult register()
        {
            return View();
        }

        public IActionResult register1()
        {
            return View();
        }

        public void Sort(ref Patient patient)
        {
            patient.Name = Correct(patient.Name);
            patient.SurName = Correct(patient.SurName);
            patient.MiddleName = Correct(patient.MiddleName);
            patient.Address = Correct(patient.Address);
            patient.Gmail = Correct(patient.Gmail);
        }

        public string Correct(string str)
        {
            StringBuilder stringBuilder = new StringBuilder();
            for (int i = 0; i < str.Length; i++)
            {
                if (str[i] == '\'')
                {
                    stringBuilder.Append(@"''");

                }
                else
                {
                    stringBuilder.Append(str[i]);
                }
            }

            return stringBuilder.ToString();
        }

        public string CheckForDoctorName(string name)
        {
            if (name != "ЭХО")
            {
                name += "у";
            }

            return name;
        }

        public void SendMessage(Patient patient)
        {
            string doctorName = CheckForDoctorName(patient.MedicHelp);
            string text = patient.MedicHelp == "Вакцинация" ? $"Пациент {patient.Name} оставил заявку.\n" +
                $"Хочет вакцинироваться.\n" +
                $"Чтобы связатся с пациентом наберите номер: {patient.PhoneNumber}." : $"Пациент {patient.Name} оставил заявку.\n" +
                $"Хочет обратится к {doctorName}.\n" +
                $"Чтобы связатся с пациентом наберите номер: {patient.PhoneNumber}.";
            var configuration = new Configuration()
            {
                BasePath = "https://ej99zn.api.infobip.com",
                ApiKeyPrefix = "App",
                ApiKey = "790fbaee8dccc83fdbcdc5944832397d-e37de1ed-9208-436b-9cfd-856f75e90697"
            };

            var sendSmsApi = new SendSmsApi(configuration);

            var smsMessage = new SmsTextualMessage()
            {
                From = $"Hospital",
                Destinations = new System.Collections.Generic.List<SmsDestination>
                {
                    new SmsDestination(to: "998908401507")
                },
                Text = text
            };

            var smsRequest = new SmsAdvancedTextualRequest()
            {
                Messages = new System.Collections.Generic.List<SmsTextualMessage>() { smsMessage }
            };

            try
            {
                var response = sendSmsApi.SendSmsMessage(smsRequest);
            }
            catch (ApiException)
            {
                Index();
            }
        }

        [HttpPost]
        public IActionResult Patient(Patient patient)
        {
            Sort(ref patient);
            string dateTime = $"{patient.DateOfBirth.Time}/{patient.DateOfBirth.Month}/{patient.DateOfBirth.Year}";
            SqlConnection conn = new(@"Server=(localdb)\MSSQLLocalDB;Database=Patients;Trusted_Connection=True;");
            //SqlConnection conn = new(@"Data Source=(localdb)\MSSQLLocalDB;Initial Catalog=Hospital;Integrated Security=True;Connect Timeout=30;Encrypt=False;TrustServerCertificate=False;ApplicationIntent=ReadWrite;MultiSubnetFailover=False");
            conn.Open();
            
            //CheckingFormatOfVisitorInput(visitors);

            SqlCommand cmd = new($"INSERT INTO PatientTable (Name, SurName, MiddleName, MedicHelp, Address, DateOfBirth, Gmail, PhoneNumber, DateOfApplication) " +
                $"VALUES " +
                $"(N'{patient.Name}', N'{patient.SurName}', N'{patient.MiddleName}', N'{patient.MedicHelp}', " +
                $"N'{patient.Address}', N'{dateTime}', N'{patient.Gmail}', N'{patient.PhoneNumber}', GETDATE())", conn);

            cmd.ExecuteNonQuery();

            SendMessage(patient);
            
            return View("Index");
        }
        

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
