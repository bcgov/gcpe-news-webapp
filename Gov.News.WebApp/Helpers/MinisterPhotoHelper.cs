using System;
using System.Collections.Generic;
using System.Text;

namespace Gov.News.Website.Helpers
{
    public static class MinisterPhotoHelper
    {
        private const string LargePhotoUrlFormat = "https://www2.gov.bc.ca/assets/gov/government/ministries-organizations/premier-cabinet-mlas/minister-large/{0}_{1}_large.jpg";

        // Mapping for ministers whose names contain special characters (diacritics/accents/punctuation)
        // where the remote large photo filename uses plain English letters: {0}_{1}_large.jpg
        // Format: { ("FirstName", "LastName"), ("NormalizedFirstName", "NormalizedLastName") }
        private static readonly Dictionary<(string FirstName, string LastName), (string NormalizedFirstName, string NormalizedLastName)> SpecialMinisterNames =
            new Dictionary<(string FirstName, string LastName), (string NormalizedFirstName, string NormalizedLastName)>
            {
                { ("Áʼa:líya", "Warbus"), ("aaliya", "warbus") },
                { ("Claire",   "Rattée"), ("claire", "rattee") },
            };

        /// <summary>
        /// Step 1: Returns true only if firstName or lastName contains characters outside standard ASCII letters (A-Z, a-z).
        /// Standard English names return false immediately and will never be modified.
        /// </summary>
        public static bool HasSpecialCharacters(string firstName, string lastName)
        {
            return ContainsNonAsciiLetter(firstName) || ContainsNonAsciiLetter(lastName);
        }

        /// <summary>
        /// Step 2: Returns true if the (firstName, lastName) pair is registered in SpecialMinisterNames.
        /// </summary>
        public static bool IsInSpecialNameList(string firstName, string lastName)
        {
            if (!HasSpecialCharacters(firstName, lastName))
            {
                return false;
            }

            var key = NormalizeKey(firstName, lastName);
            return SpecialMinisterNames.ContainsKey(key);
        }

        /// <summary>
        /// Step 3: Builds the large photo URL using the mapped ASCII file name parts from SpecialMinisterNames.
        /// </summary>
        public static string GetLargePhotoUrl(string firstName, string lastName)
        {
            var key = NormalizeKey(firstName, lastName);
            if (SpecialMinisterNames.TryGetValue(key, out var mappedName))
            {
                firstName = mappedName.NormalizedFirstName;
                lastName = mappedName.NormalizedLastName;
            }

            return string.Format(LargePhotoUrlFormat, firstName, lastName);
        }

        private static bool ContainsNonAsciiLetter(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return false;
            }

            foreach (char c in value)
            {
                bool isAsciiLetter = (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
                if (!isAsciiLetter)
                {
                    return true;
                }
            }

            return false;
        }

        private static (string FirstName, string LastName) NormalizeKey(string firstName, string lastName)
        {
            return (
                (firstName ?? string.Empty).Normalize(NormalizationForm.FormC),
                (lastName ?? string.Empty).Normalize(NormalizationForm.FormC)
            );
        }
    }
}
