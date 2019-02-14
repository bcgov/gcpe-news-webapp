using System;
using System.Collections.Generic;
using Gov.News.Api.Models;

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

        public SearchViewModel()
        {
            Success = true;
            Results = new List<Result>();
            FacetResults = new Dictionary<string, IEnumerable<FacetHit>>();
        }

        public class SearchQuery
        {
            public string Text { get; set; }
            public IDictionary<string, string> Filters;
            public DateTime? Date { get; set; }
            public string DateWithin { get; set; }
        }


        public class Result
        {
            public string Title { get; set; }

            public Uri Uri { get; set; }

            public string Description { get; set; }

            public bool HasMediaAssets { get; set; }

            public Uri ThumbnailUri { get; set; }

            public DateTimeOffset PublishDate { get; set; }
        }

        public class FacetHit
        {
            public string Value { get; set; }
            public long Count { get; set; }
        }
    }
}