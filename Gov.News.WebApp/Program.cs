using System;
using System.IO;
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
            CreateWebHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateWebHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseStartup<Startup>();
                webBuilder.UseContentRoot(Directory.GetCurrentDirectory());
#if DEBUG
                webBuilder.UseUrls("http://localhost:53488/");
#endif
                webBuilder.UseIISIntegration();
            });
    }
}
