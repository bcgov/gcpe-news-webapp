﻿using System;
using System.Collections.Generic;
using Gov.News.Api.Models;

namespace Gov.News.Website.Models
{
    public class BaseViewModel
    {
        public string Title { get; set; }

        public Uri CanonicalUri { get; set; }

        public Uri OGMetaImageUrl { get; set; }

        public ICollection<IndexModel> Ministries { get; private set; }
        public ICollection<IndexModel> Sectors { get; private set; }

        public IEnumerable<ResourceLink> ResourceLinks { get; set; }

        public bool WebcastingLive { get; set;}

        public bool GranvilleLive { get; set; }

        public BaseViewModel()
        {
            OGMetaImageUrl = new Uri(Properties.Settings.Default.NewsHostUri, "/Content/Images/Gov/default-og-image-new.jpg");

            Ministries = new List<IndexModel>();
            Sectors = new List<IndexModel>();
        }

        public virtual string SubscribePath()
        {
            return "/subscribe";
        }
    }
}