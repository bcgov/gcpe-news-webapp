﻿using Gov.News.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Gov.News.Website.Models
{
    public class ConnectViewModel : BaseViewModel
    {
        public class ExternalConnectLink
        {
            public string Title { get; set; }
            public string Url { get; set; }
            public string Summary { get; set; }
        }

        public ExternalConnectLink[] YoutubeLinks { get; set; }
        public ExternalConnectLink[] FlickrLinks { get; set; }
        public ExternalConnectLink[] FacebookLinks { get; set; }
        public ExternalConnectLink[] BlogsLinks { get; set; }
        public ExternalConnectLink[] RssLinks { get; set; }
        public ExternalConnectLink[] TwitterLinks { get; set; }
        public ExternalConnectLink[] InstagramLinks { get; set; }
        public ExternalConnectLink[] ThreadsLinks { get; set; }
        public ExternalConnectLink[] WeiboLinks { get; set; }
        public ExternalConnectLink[] LinkedinLinks { get; set; }
    }
}