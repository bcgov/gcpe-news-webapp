using System;
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

        public IDictionary<string, string> AllQueryFilters()
        {
            var filters = Query.Filters != null ? new Dictionary<string, string>(Query.Filters) 
                                                : new Dictionary<string, string>();
            if (Query.Date != DateTime.Today)
            {
                filters["Date"] = Query.Date.ToString("MM/dd/yyyy");
            }
            if (Query.DateWithin != SearchQuery.defaultDateWithin)
            {
                filters["DateWithin"] = Query.DateWithin;
            }
            if (FirstResult != 1)
            {
                filters["Page"] = Page.ToString();
            }
            return filters;
        }

        public SearchViewModel()
        {
            Success = true;
            Results = new List<Result>();
            FacetResults = new Dictionary<string, IEnumerable<FacetHit>>();
        }

        public class SearchQuery
        {
            internal const string defaultDateWithin = "2 years";

            public SearchQuery(string text, DateTime? date = null, string dateWithin = null, IDictionary<string, string> filters = null)
            {
                this.Text = text;
                this.Date = date ?? DateTime.Today; 
                this.DateWithin = dateWithin ?? defaultDateWithin;
                Filters = filters;
            }

            public string Text { get; }
            public IDictionary<string, string> Filters { get; }
            public DateTime Date { get; }
            public string DateWithin { get; }
        }

        public class Result
        {
            public string Title { get; set; }

            public Uri Uri { get; set; }

            public string Description { get; set; }

            public bool HasMediaAssets { get; set; }

            public Uri ThumbnailUri { get; set; }

            public DateTime PublishDate { get; set; }
        }

        public class FacetHit
        {
            public string Value { get; set; }
            public long Count { get; set; }
        }
    }
}