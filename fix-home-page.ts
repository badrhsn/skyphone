// Quick script to fix the home page country loading to use database flags
import fs from 'fs';

const homePagePath = '/Users/badr/yadaphone-app/src/app/page.tsx';
let content = fs.readFileSync(homePagePath, 'utf8');

// Find and replace the fetchRatesAndCountries function
const functionStart = content.indexOf('const fetchRatesAndCountries = async () => {');
const functionEnd = content.indexOf('};', functionStart) + 2;

const newFunction = `const fetchRatesAndCountries = async () => {
    try {
      const response = await fetch("/api/rates");
      if (response.ok) {
        const ratesData = await response.json();
        setRates(ratesData);
        
        // Create countries from rates using flags from database
        const uniqueCountries = new Map();
        ratesData.forEach((rate: any) => {
          if (!uniqueCountries.has(rate.country)) {
            // Use flag from database, fallback to earth emoji if no flag
            const flag = rate.flag || "🌍";
            uniqueCountries.set(rate.country, {
              name: rate.country,
              code: rate.countryCode,
              flag: flag
            });
          }
        });
        
        const countriesArray = Array.from(uniqueCountries.values()).sort((a: any, b: any) => 
          a.name.localeCompare(b.name)
        );
        
        setCountries(countriesArray);
        
        // Set default to United States if available
        const defaultCountry = countriesArray.find((c: any) => c.name === "United States") || countriesArray[0];
        if (defaultCountry) {
          setSelectedCountry(defaultCountry.name);
          setCountryCode(defaultCountry.code);
        }
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
    } finally {
      setIsLoadingCountries(false);
    }
  };`;

// Replace the function
const newContent = content.substring(0, functionStart) + newFunction + content.substring(functionEnd);

fs.writeFileSync(homePagePath, newContent);
console.log('✅ Fixed home page to use database flags');