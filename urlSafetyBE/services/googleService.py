import requests
from flask import current_app
#Imports

#API checks against saved list of known unsafe web resources
class SafeBrowsingService:
    def __init__(self):
        self.apiKey = current_app.config['SAFE_BROWSING_API'] #Get API key from config file
        self.baseURL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find' #Call API URL

    def checkURL(self, urlToCheck):
        #Returns True if the URL is UNSAFE (Found in Threats list).
        #Returns False if the URL is SAFE.

        request = { #Request body. Format for what is returned by API
            'client' : {
                'clientId' : 'urlSafetyBE',
                'clientVersion' : '1.0.0'
            },
            'threatInfo' : {
                'threatTypes' : ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'], #ThreatTypes - the type of threat posed, .e.g MAlware, social engineering
                'platformTypes' : ['ANY_PLATFORM'], #PlatformTypes - The platform being targeted, e.g. windows, Linix, IOS - ANY_Platform: Threat posed to at least one of the defined platforms.
                'threatEntryTypes' : ['URL'],#ThreatEntryTypes - the enrty type of the threat posed, e.g URL - URL: Threat entry is via a URL
                'threatEntries' : [{'url' : urlToCheck}] #The URL to check
            }
        }

        params = {'key' : self.apiKey} #API connection key

        try:
            #self.baseURL - call to Google API
            #params=params - PAss API key as a parameter url 
            #json=request - json object to send to url
            response = requests.post(self.baseURL, params=params, json=request)
            response.raise_for_status() #Returns status code 
            data = response.json()
            
            #If the API returns an empty dictionary {}, the URL is considered safe.
            #If it returns a 'matches key, the URL is considered dangerous.
            if 'matches' in data:
                return True, data['matches'] #Unsafe
            return False, None #Safe
        
        except requests.exceptions.RequestException as e:
            print(f'Safe Browsing API Error: {e}')
            return False, None