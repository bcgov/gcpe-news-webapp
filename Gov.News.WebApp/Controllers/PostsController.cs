using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.IO;
using System.Security.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Gov.News.Api.Models;
using Gov.News.Website.Helpers;
using Gov.News.Website.Middleware;
using Gov.News.Website.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Gov.News.Website.Controllers.Shared
{
    public class PostsController : IndexController<DataIndex>
    {
        private const string PlaceholderImageRelativePath = "Content/Images/Gov/BC_Gov_News_1280x720.png";
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<PostsController> _logger;

        public PostsController(Repository repository, IConfiguration configuration, IWebHostEnvironment environment, ILogger<PostsController> logger) : base(repository, configuration)
        {
            _environment = environment ?? throw new ArgumentNullException(nameof(environment));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<ActionResult> Details(string key)
        {
            var post = await Repository.GetPostAsync(key);

            var model = await LoadDetails(post);

            if (post?.RedirectUri != null)
                return Redirect(post.RedirectUri.ToString());

            if (model == null)
                return await SearchNotFound();

            // We can't just use post.Timestamp here because we would have to take into account the mega-menu(ministries), sidebar(media contacts, featured topics an services, related newsletters and posts), Live Webcast)
            //if (NotModifiedSince(post.Timestamp))
            //    return StatusCode(StatusCodes.Status304NotModified);

            ViewData.Add("CustomContentClass", "detail");
            return View("PostView", model);
        }

        public async Task<ActionResult> Image(string key)
        {
            var post = key != null ? await Repository.GetPostAsync(key) : null;

            if (post == null)
                return await SearchNotFound();

            if (NotModifiedSince(post.Timestamp))
            {
                return StatusCode(StatusCodes.Status304NotModified);
            }

            var thumbnailUri = post.GetThumbnailUri();
            if (thumbnailUri == null)
            {
                _logger.LogWarning("No thumbnail uri available for post {PostKey}.", key);
                return GetFallbackImage();
            }

            var thumbnailUriProxy = thumbnailUri.ToProxyUrl();
            if (string.IsNullOrWhiteSpace(thumbnailUriProxy))
            {
                _logger.LogWarning("Proxy thumbnail url missing for post {PostKey}.", key);
                return GetFallbackImage();
            }

            using var client = new HttpClient(new HttpClientHandler { UseDefaultCredentials = true });
            client.DefaultRequestHeaders.Referrer = new Uri(string.Concat(Request.Scheme, "://", Request.Host.ToUriComponent(), Request.PathBase.ToUriComponent(), Request.Path, Request.QueryString));

            try
            {
                using var response = await client.GetAsync(thumbnailUriProxy);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Thumbnail request for post {PostKey} returned status {StatusCode}.", key, response.StatusCode);
                    return GetFallbackImage();
                }

                var contentType = response.Content.Headers.ContentType?.ToString() ?? "image/jpeg";
                var payload = await response.Content.ReadAsByteArrayAsync();
                if (payload == null || payload.Length == 0)
                {
                    _logger.LogWarning("Thumbnail response for post {PostKey} was empty.", key);
                    return GetFallbackImage();
                }

                return new FileContentResult(payload, contentType);
            }
            catch (HttpRequestException ex) when (ex.InnerException is AuthenticationException)
            {
                _logger.LogWarning(ex, "SSL certificate validation failed for thumbnail request on post {PostKey}.", key);
                return GetFallbackImage();
            }
            catch (AuthenticationException ex)
            {
                _logger.LogWarning(ex, "Authentication error when retrieving thumbnail for post {PostKey}.", key);
                return GetFallbackImage();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error retrieving thumbnail for post {PostKey}.", key);
                return GetFallbackImage();
            }
        }

        [ResponseCache(CacheProfileName = "Default"), Noindex]
        public async Task<ActionResult> Index(string key, string postKind)
        {
            var model = await GetHomePosts(postKind);

            if (model == null)
                return await SearchNotFound();

            return View("PostsView", model);
        }

        private ActionResult GetFallbackImage()
        {
            var placeholderPath = Path.Combine(_environment.WebRootPath, PlaceholderImageRelativePath.Replace('/', Path.DirectorySeparatorChar));
            if (System.IO.File.Exists(placeholderPath))
            {
                return PhysicalFile(placeholderPath, "image/png");
            }

            _logger.LogWarning("Placeholder thumbnail not found at path {PlaceholderPath}.", placeholderPath);
            return StatusCode(StatusCodes.Status502BadGateway);
        }

        const int RelatedArticlesLength = 3;

        public async Task<PostViewModel> LoadDetails(Post post)
        {
            Ministry ministry = post != null ? await Repository.GetMinistryAsync(post.LeadMinistryKey) : null;
            if (ministry == null) return null;

            PostViewModel model = new PostViewModel(post);

            await LoadAsync(model);

            model.LeadMinistry = model.Ministries.FirstOrDefault(m => m.Index.Key == post.LeadMinistryKey);
            if (model.LeadMinistry == null)
            { // for Archived ministries
                model.LeadMinistry = new IndexModel(ministry);
            }

            model.Minister = await Repository.GetMinisterAsync(post.LeadMinistryKey);

            model.RelatedMinistryKeys = (await Repository.GetPostMinistriesAsync(post)).Select(m => m.Key);

            model.RelatedSectorKeys = (await Repository.GetPostSectorsAsync(post)).Select(m => m.Key);

            //Load [RelatedArticlesLength] posts, excluding the current post
            List<Post> posts = new List<Post>();
            if (model.LeadMinistry.TopPost != null)
            {
                posts.Add(model.LeadMinistry.TopPost);
            }
            if (model.LeadMinistry.FeaturePost != null)
            {
                posts.Add(model.LeadMinistry.FeaturePost);
            }
            posts.AddRange(await Repository.GetLatestPostsAsync(ministry, RelatedArticlesLength - posts.Count + 1, null, MinistryFilter(ministry.Key)));
            model.RelatedArticles = posts.Where(e => e.Key != model.Post.Key).Take(RelatedArticlesLength);

            model.Footer = await GetFooter(ministry);

            return model;
        }

    }
}
