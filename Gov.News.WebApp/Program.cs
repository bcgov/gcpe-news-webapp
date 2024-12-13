using System;
using System.IO;
using System.Net;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;

#if EXCEPTION_REPORTING_ENABLED
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
#endif


namespace Gov.News.Website
{
    public class Program
    {
        public static void Main(string[] args)
        {
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12 | SecurityProtocolType.Tls13;
            CreateWebHostBuilder(args).Build().Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args)
        {
            return WebHost.CreateDefaultBuilder(args)
#if DEBUG
                .UseUrls("http://localhost:53488/")
#endif
                .UseContentRoot(Directory.GetCurrentDirectory())
                .UseStartup<Startup>()
                .UseIISIntegration();
        }
    }
}
