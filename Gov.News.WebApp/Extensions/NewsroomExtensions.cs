using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Encodings.Web;
using System.Text.RegularExpressions;
using System.Web;
using Gov.News.Api.Models;

namespace Gov.News.Website
{
    public static class NewsroomExtensions
    {
        private static Uri AppendUriSegment(Uri uri, string segment)
        {
            if (uri.AbsolutePath.EndsWith("/"))
            {
                return new Uri(uri, segment);
            }
            else
            {
                var baseUri = new Uri(uri.ToString() + "/");
                return new Uri(baseUri, segment);
            }
        }

        public static Uri GetThumbnailUri(this Post post)
        {
            return GetThumbnailUri(post.AssetUrl);
        }

        public static Uri GetThumbnailUri(string assetUrl)
        {
            Uri assetUri;
            if (!Uri.TryCreate(assetUrl, UriKind.Absolute, out assetUri)) return null;

            Uri thumbnailUri = null;

            if (assetUri.Host == "www.youtube.com")
            {
                var query = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(assetUri.Query);

                if (query.ContainsKey("v"))
                {
                    var videoId = query["v"];

                    var youtubeIframeUrl = string.Format("//www.youtube.com/embed/{0}?rel=0&amp;modestbranding=1&amp;wmode=transparent", videoId);

                    thumbnailUri = new Uri(string.Format("https://img.youtube.com/vi/{0}/maxresdefault.jpg", videoId));
                }
            }
            else if (assetUri.Host.EndsWith("staticflickr.com"))
            {
                var flickrRegex = new Regex(@"https?:\/\/(farm([0-9]+)|live)\.staticflickr\.com\/([0-9]+)\/([0-9]+)_([0-9a-f]+)(_[a-z])?\.jpg");

                var flickrMatch = flickrRegex.Match(assetUri.ToString());

                if (flickrMatch.Success)
                {
                    // Get the "n" size flickr image (320x320)
                    //assetUrl = assetUrl.Replace(flickrMatch.Groups[5].Value, "n.jpg");
                    //TODO: var flickrUrl = string.Format("https://www.flickr.com/photos/{0}/{1}/", "bcgovphotos", flickrMatch.Groups[3].Value);

                    thumbnailUri = assetUri;
                }
            }
            else if (assetUrl.ToLower() == "https://news.gov.bc.ca/live")
            {
                thumbnailUri = new Uri("https://news.gov.bc.ca/Content/Images/Gov/Live_Webcast.png");
            }
            return thumbnailUri;
        }

        public static Uri GetUri(this Post post)
        {
            return GetPostUri(post.Kind, post.Key);
        }

        public static Uri GetPostUri(string postKind, string postKey)
        {
            Uri uri = AppendUriSegment(Properties.Settings.Default.NewsHostUri, postKind);

            return AppendUriSegment(uri, UrlEncoder.Default.Encode(postKey));
        }

        public static Uri GetMinisterUri(this Ministry ministry)
        {
            var uri = Properties.Settings.Default.NewsHostUri;

            if (ministry.Key != "office-of-the-premier")
                uri = AppendUriSegment(uri, "ministries");

            uri = AppendUriSegment(uri, ministry.Key);

            uri = AppendUriSegment(uri, "biography");

            return uri;
        }

        public static Uri GetUri(this Asset asset)
        {
            return GetUri(asset, Properties.Settings.Default.NewsHostUri);
        }

        public static Uri GetUri(this Asset asset, Uri uri)
        {
            uri = AppendUriSegment(uri, "assets");

            uri = AppendUriSegment(uri, asset.Key.Substring(0, asset.Key.LastIndexOf('/') + 1));

            uri = AppendUriSegment(uri, asset.Label); // Label has the correct casing

            return uri;
        }

        public static Uri GetTranslationUri(this Asset asset)
        {
            return GetTranslationUri(asset, Properties.Settings.Default.NewsHostUri);
        }

        public static Uri GetTranslationUri(this Asset asset, Uri uri)
        {
            uri = AppendUriSegment(uri, "translations");

            uri = AppendUriSegment(uri, asset.Key.Substring(0, asset.Key.LastIndexOf('/') + 1));

            uri = AppendUriSegment(uri, asset.Label); // Label has the correct casing

            return uri;
        }

        public static Uri GetUri(this DataIndex index)
        {
            var uri = Properties.Settings.Default.NewsHostUri;

            var ministry = index as Ministry;
            if (ministry != null)
            {
                if (index.Key != "office-of-the-premier")
                {
                    uri = AppendUriSegment(uri, "ministries");

                    if (ministry.ParentMinistryKey != null)
                    {
                        uri = AppendUriSegment(uri, UrlEncoder.Default.Encode(ministry.ParentMinistryKey));
                    }
                }
            }
            else if (index.Kind == "tags" && index.Key == "speeches")
            {
                uri = AppendUriSegment(uri, "office-of-the-premier");
            }
            else
            {
                uri = AppendUriSegment(uri, index.Kind);
            }

            uri = AppendUriSegment(uri, UrlEncoder.Default.Encode(index.Key));

            return uri;
        }

        public static Uri GetPermanentUri(this Post entry)
        {
            if (entry.Reference.StartsWith("NEWS-"))
                return AppendUriSegment(Properties.Settings.Default.NewsHostUri, entry.Reference.Substring(5));

            return entry.GetUri();
        }

        public static string Headline(this Post post)
        {
            return post.Documents.First().Headline;
        }

        public static string GetShortSummary(this Post entry, int? count)
        {
            //TODO: Determine correct way to handle an empty Summary
            string[] words = entry.Summary.Split();
            string shortSummary = entry.Summary;
            if (count != null || words.Count() > count)
            {
                //Find the end of sentence
                int index = (int)count;
                for (; index < words.Count(); index++)
                {
                    if (words[index].EndsWith("."))
                    {
                        break;
                    }
                }
                if (index >= words.Count())
                    index = words.Count() - 1;
                shortSummary = string.Join(" ", words.Take(index + 1));
                if (!words[index].EndsWith("."))
                {
                    shortSummary += "...";
                }
            }
            return shortSummary;
        }

        public static Uri ToUri(this string uri)
        {
            if (string.IsNullOrEmpty(uri))
            {
                return null;
            }
            return new Uri(uri);
        }

        public static String ToDefaultTranslationLanguage(this string label)
        {
            String rvl = "View translation";

            var languageNameMappings = new Dictionary<string, string>() {
                { "Arabic", "اعرض الترجمة باللغة العربية" },
                { "Chinese_Simplified", "查看简体中文翻译" },
                { "Chinese(Simplified)", "查看简体中文翻译" },
                { "Chinese_Traditional", "查看繁體中文翻譯" },
                { "Chinese(Traditional)", "查看繁體中文翻譯" },
                { "Farsi", "ترجمه را به فارسی ببینید" },
                { "French", "Voir la traduction en français" },
                { "Hebrew", "צפה בתרגום בעברית" },
                { "Hindi", "हिंदी में अनुवाद देखें"},
                { "Indonesian" , "Lihat terjemahan dalam bahasa Indonesia"},
                { "Japanese", "翻訳を日本語表示する" },
                { "Korean", "한국어 번역 보기" },
                { "Punjabi", "ਪੰਜਾਬੀ ਵਿੱਚ ਅਨੁਵਾਦ ਦੇਖੋ"},
                { "Spanish", "Ver la traducción en español" },
                { "Tagalog", "Tingnan ang pagsasalin sa Tagalog" },
                { "Urdu", "اردو میں ترجمہ دیکھیں" },
                { "Vietnamese", "Xem bản dịch bằng tiếng Việt" }
            };

            foreach (KeyValuePair<string, string> entry in languageNameMappings)
            {
                if (label.Contains(entry.Key, StringComparison.OrdinalIgnoreCase))
                {
                    rvl = entry.Value;
                }
            }

            return rvl;
        }

        public static String ToTranslatedLanguageName(this string label)
        {
            string rvl = "";

            var languageNameMappings = new Dictionary<string, string>() {
                { "Arabic", "عربى" },
                { "Chinese_Simplified", "简体中文" },
                { "Chinese(simplified)", "简体中文" },
                { "Chinese_Traditional", "繁體中文" },
                { "Chinese(traditional)", "查看繁體中文翻譯" },
                { "Farsi", "فارسی" },
                { "French", "Français" },
                { "Hebrew", "עִברִית" },
                { "Hindi", "हिंदी"},
                { "Indonesian" , "bahasa Indonesia"},
                { "Japanese", "日本語" },
                { "Korean", "한국어" },
                { "Punjabi", "ਪੰਜਾਬੀ"},
                { "Spanish", "Español" },
                { "Tagalog", "Tagalog" },
                { "Urdu", "اردو" },
                { "Vietnamese", "Tiếng Việt" }
            };

            foreach (KeyValuePair<string, string> entry in languageNameMappings)
            {
                if (label.Contains(entry.Key, StringComparison.OrdinalIgnoreCase))
                {
                    rvl = entry.Value;
                }
            }

            return rvl;
        }

        public static string ToConstrainedDateRangeQueryString(this string query)
        {
            Dictionary<string, string> dateCollections = new Dictionary<string, string> {
                { "2020-2024", "November 26, 2020 to current date" },
                { "2017-2021", "July 18, 2017 to November 25, 2020" },
                { "2017-2017", "June 12, 2017 to July 17, 2017" },
                { "2013-2017", "June 10, 2013 to June 11, 2017" },
                { "2009-2013", "March 12, 2011 to June 9, 2013" }
            };

            // constrain the data returned to a specific start and end date rather than a start and end year
            Regex regex = new Regex(@"Date=([0-9]{4}\-[0-9]{4})");
            bool isMatch = regex.IsMatch(query);

            string capturedDateRange = "";
            if (isMatch)
            {
                Match match = regex.Match(query);
                capturedDateRange = match.Groups[1].Captures[0].Value;
            }

            string dates;
            if (dateCollections.TryGetValue(capturedDateRange, out dates))
            {
                var range = dates.Split("to");

                var startDate = range[0].Trim();
                var endDate = range[1].Trim();

                DateTime? endDateTime = endDate == "current date" ? DateTime.Now : DateTime.Parse(endDate);
                DateTime? startDateTime = DateTime.Parse(startDate);
                query = query.Replace($"Date={capturedDateRange}",
                    $"fromDate={startDateTime.Value.ToString("yyyy/MM/dd").Replace("/", "%2F")}" +
                    $"&toDate={endDateTime.Value.ToString("yyyy/MM/dd").Replace("/", "%2F")}");
            }

            return query;
        }
    }
}
