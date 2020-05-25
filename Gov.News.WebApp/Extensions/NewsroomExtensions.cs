﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Encodings.Web;
using System.Text.RegularExpressions;
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
            if (post.FacebookPictureUri != null)
            {
                return new Uri(post.FacebookPictureUri);
            }
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

                    thumbnailUri = new Uri(string.Format("https://img.youtube.com/vi/{0}/0.jpg", videoId));
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

        public static string PosterUrl(this FacebookPost facebookPost)
        {
            int posterIdx = facebookPost.Key.IndexOf("facebook.com/"); // facebookPost.Key is the postUrl
            if (posterIdx != -1)
            {
                posterIdx = facebookPost.Key.IndexOf('/', posterIdx + "facebook.com/".Length);
            }
            return posterIdx != -1 ? facebookPost.Key.Substring(0, posterIdx) : null;
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
                { "Chinese_Traditional", "查看繁體中文翻譯" },
                { "Farsi", "ترجمه را به فارسی ببینید"  },               
                { "French", "Voir la traduction en français" },
                { "Hebrew", "צפה בתרגום בעברית" },
                { "Hindi", "हिंदी में अनुवाद देखें"},
                { "Indonesian" , "Lihat terjemahan dalam bahasa Indonesia"},
                { "Japanese", "翻訳を日本語で表示" },
                { "Korean", "한국어로 번역보기" },
                { "Punjabi", "ਪੰਜਾਬੀ ਵਿੱਚ ਅਨੁਵਾਦ ਦੇਖੋ"},
                { "Spanish", "Ver traducción en español" },
                { "Tagalog", "Tingnan ang pagsasalin sa Tagalog" },
                { "Urdu", "اردو میں ترجمہ دیکھیں" },
                { "Vietnamese", "Xem bản dịch bằng tiếng việt" }
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
    }
}