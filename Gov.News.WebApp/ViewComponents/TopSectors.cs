using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Gov.News.Api.Models;
using Gov.News.Website;
using Gov.News.Website.Models;
using Microsoft.AspNetCore.Mvc;

namespace ViewComponentSample.ViewComponents
{
    public class TopSectorsViewComponent : ViewComponent
    {
        protected Repository _repository;

        public TopSectorsViewComponent(Repository repository)
        {
            _repository = repository;
        }

        public async Task<IViewComponentResult> InvokeAsync()
        {
            var items = await GetItemsAsync();
            return View("TopSectors", items);
        }
        private async Task<IEnumerable<IndexModel>> GetItemsAsync()
        {
            var sectors = await _repository.GetSectorsAsync();
            
            var sectorModels = new List<IndexModel>();
            
            foreach (var sector in sectors)
            {
                var sectorModel = new IndexModel(sector);
                var data = new DataModel();
                var post = await _repository.GetLatestPostsAsync(sector, 1, null, GetIndexFilter(sector));
                sectorModel = new IndexModel(sector, post);
                sectorModels.Add(sectorModel);
            }
            return sectorModels;
        }

        private Func<Post, bool> GetIndexFilter(DataIndex index)
        {
            if (index.Kind == "sectors")
            {
                return SectorFilter(index.Key); 
            }
            return null;
        }

        private static Func<Post, bool> SectorFilter(string sectorKey)
        {
            return post => post.SectorKeys.Any(k => k == sectorKey);
        }
    }
}
