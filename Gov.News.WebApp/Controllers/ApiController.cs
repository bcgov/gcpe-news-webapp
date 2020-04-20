using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

namespace Gov.News.Website.Controllers
{
    [Route("api")]
    public class ApiController
    {
        [HttpGet("live/playlist")]
        public IEnumerable<string> GetLivePlaylist()
        {
            return Hubs.LiveHub.WebcastingPlaylists;
        }

        [HttpGet("live/granville")]
        public bool GetIsGranvilleLive()
        {
            return Hubs.LiveHub.IsGranvilleLive;
        }
    }
}
