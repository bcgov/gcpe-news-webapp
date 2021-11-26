using System;

namespace Gov.News.Website.Properties
{
    //This class is to support the migration from MVC 5 to MVC Core 1.1; it will be
    //replaced with IOptions or another convention through dependency injection.
    public class Settings
    {
        public static Settings Default { get; }

        static Settings()
        {
            Default = new Settings();
        }

        public Uri NewsHostUri { get; set; }

        public Uri NewsMediaHostUri { get; set; }

        public string NewsMediaProxyKey { get; set; }

#if USE_SIGNALR
        public string SignalREnabled { get; set; } = "true";
#endif
        public string SignalREnabled { get; } = "false";

        public string EnableDynamicFooter { get; set; } = "false";

        public Uri AzureSearchUri { get; set; }

        public string AzureSearchKey { get; set; }

        public Uri AzureBlobSearchTCUri { get; set; }
        public Uri AzureBlobSearchFRUri { get; set; }
        public Uri AzureBlobSearchPunjabiUri { get; set; }

        public string AzureBlobSearchKey { get; set; }

        public DateTimeOffset RssFeedCutoffDate { get; set; }

        public string MediaAssetsLicenseUri { get; set; }

        public string GoogleSiteVerification { get; set; }

        public string BingSiteVerification { get; set; }

        public string FacebookOwnershipId { get; set; }

        public Uri ContactUri { get; set; }

        public Uri ArchiveHostUri { get; set; }

        public Uri NewslettersHostUri { get; set; }

        public Uri NewsroomHostUri { get; set; }

        public String Granville { get; set; }
    }
}
