using System;
using System.Linq;
using System.Collections.Generic;

namespace Gov.News.Website.Models
{
    public class SearchViewModel : BaseViewModel
    {
        public bool Success { get; set; }

        public long Count { get; set; }

        public long FirstResult { get; set; }

        public long LastResult { get; set; }

        public long ResultsPerPage { get; set; }

        public SearchQuery Query { get; set; }


        public List<Result> Results { get; private set; }

        public long Page
        {
            get { return (FirstResult / ResultsPerPage) + 1; }
        }

        public int LastPage { get; set; }

        public IDictionary<string, IEnumerable<FacetHit>> FacetResults { get; set; }

        public IDictionary<string, string> AllQueryFilters(bool includePage = true)
        {
            var filters = Query.Filters != null ? new Dictionary<string, string>(Query.Filters) 
                                                : new Dictionary<string, string>();
            if (Query.FromDate != MinDate)
            {
                filters["FromDate"] = Query.FromDate.ToString("MM/dd/yyyy");
            }
            if (Query.ToDate != DateTime.Today)
            {
                filters["ToDate"] = Query.ToDate.ToString("MM/dd/yyyy");
            }
            if (includePage && FirstResult != 1)
            {
                filters["Page"] = Page.ToString();
            }
            return filters;
        }
        public string QueryString(string key, string value)
        {
            var queryFilters = AllQueryFilters(false);
            queryFilters["q"] = Query.Text;
            queryFilters[key] = value;
            return string.Join("&", queryFilters.Where(f => f.Value != null).Select(f => f.Key + "=" + f.Value));
        }

        public SearchViewModel()
        {
            Success = true;
            Results = new List<Result>();
            FacetResults = new Dictionary<string, IEnumerable<FacetHit>>();
        }

        public static Dictionary<string, string> DateCollections = new Dictionary<string, string> {
                { "2024-2028", "November 18, 2024 to current date" },
                { "2020-2024", "November 26, 2020 to November 17, 2024" },
                { "2017-2021", "July 18, 2017 to November 25, 2020" },
                { "2017-2017", "June 12, 2017 to July 17, 2017" },
                { "2013-2017", "June 10, 2013 to June 11, 2017" },
                { "2009-2013", "March 12, 2011 to June 9, 2013" }
            };
        public static DateTime MinDate = DateTime.Parse("2011/03/12");
        public class SearchQuery
        {
            public SearchQuery(string text, DateTime? fromDate = null, DateTime? toDate = null, IDictionary<string, string> filters = null)
            {
                Text = text;
                FromDate = fromDate ?? MinDate;
                ToDate = toDate ?? DateTime.Today;
                Filters = filters;
            }

            public string Text { get; }
            public IDictionary<string, string> Filters { get; }
            public DateTime ToDate { get; }
            public DateTime FromDate { get; }

            public bool UseCustomRange()
            {
                return FromDate != MinDate || ToDate != DateTime.Today;
            }
        }

        public class Result
        {
            public string Title { get; set; }

            public string Headline { get; set; }

            public Uri Uri { get; set; }

            public string Description { get; set; }

            public bool HasMediaAssets { get; set; }

            public bool HasTranslations { get; set; }

            public Uri ThumbnailUri { get; set; }

            public DateTime PublishDate { get; set; }

            public string AssetUrl { get; set; }

            public string SocialMediaHeadline { get; set; }
        }

        public class FacetHit
        {
            public string Value { get; set; }
            public long Count { get; set; }
        }
    }
}